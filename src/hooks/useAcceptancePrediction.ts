import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Hospital } from '@/data/hospitals';
import { AcceptancePrediction } from '@/types/acceptance';
import { getTimePatternMultiplier } from '@/lib/erPatterns';
import { fetchWeatherRisk, WeatherRisk } from '@/services/weatherService';

// ── Legacy exports kept for backward compatibility ──
export type AcceptanceStatus = 'smooth' | 'delayed' | 'warning' | 'no_data';

export function getAcceptanceStatus(rate: number | null, totalEntries: number): AcceptanceStatus {
  if (totalEntries === 0 && rate === null) return 'no_data';
  const r = rate ?? 0;
  if (r >= 70) return 'smooth';
  if (r >= 40) return 'delayed';
  return 'warning';
}

export function getAcceptanceLabel(status: AcceptanceStatus): string {
  switch (status) {
    case 'smooth': return '원활';
    case 'delayed': return '지연 가능';
    case 'warning': return '거절 주의';
    case 'no_data': return '데이터 수집 중';
  }
}

export function getAcceptanceColor(status: AcceptanceStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'smooth':
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    case 'delayed':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'warning':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'no_data':
      return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
  }
}

// ── Distance utility ──
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Main hook ──
export function useAcceptancePrediction(
  hospitalId: number | undefined,
  hospital?: Hospital | null,
  allHospitals?: Hospital[],
) {
  const [weatherData, setWeatherData] = useState<WeatherRisk | null>(null);

  // Fetch weather async
  useEffect(() => {
    if (!hospital) return;
    let cancelled = false;
    fetchWeatherRisk(hospital.lat, hospital.lng).then(w => {
      if (!cancelled) setWeatherData(w);
    });
    return () => { cancelled = true; };
  }, [hospital?.lat, hospital?.lng]);

  // Fetch incoming ambulance count
  const { data: incomingCount = 0 } = useQuery({
    queryKey: ['incoming-ambulance-count', hospitalId],
    queryFn: async () => {
      if (!hospitalId) return 0;
      const { count } = await supabase
        .from('active_ambulance_trips')
        .select('*', { count: 'exact', head: true })
        .eq('destination_hospital_id', hospitalId)
        .eq('status', 'en_route');
      return count || 0;
    },
    enabled: !!hospitalId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Try edge function first
  const { data: edgePrediction, isLoading: isEdgeLoading } = useQuery({
    queryKey: ['predict-acceptance-edge', hospitalId],
    queryFn: async (): Promise<AcceptancePrediction | null> => {
      if (!hospitalId) return null;
      try {
        const { data, error } = await supabase.functions.invoke('predict-acceptance', {
          body: { hospital_id: hospitalId },
        });
        if (error || !data?.probability) return null;
        return {
          ...data,
          dataFreshness: {
            ...data.dataFreshness,
            lastUpdated: new Date(data.dataFreshness?.lastUpdated || Date.now()),
          },
        } as AcceptancePrediction;
      } catch {
        return null;
      }
    },
    enabled: !!hospitalId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  // Local calculation as fallback
  const localPrediction = useMemo((): AcceptancePrediction | null => {
    if (!hospital) return null;

    // ── Layer 1: Occupancy (40%) ──
    const totalBeds = hospital.beds.general + hospital.beds.pediatric + hospital.beds.fever;
    const available = Math.max(0, totalBeds);
    const maxCapacity = Math.max(totalBeds + 10, 20); // estimate total capacity
    const occupancyRate = totalBeds <= 0 ? 95 : Math.min(100, ((maxCapacity - available) / maxCapacity) * 100);
    let occupancyScore = occupancyRate;
    if (incomingCount >= 3) occupancyScore = Math.min(100, occupancyScore + 15);

    // ── Layer 2: Time pattern (30%) ──
    const now = new Date();
    const patternMultiplier = getTimePatternMultiplier(now);
    const patternScore = Math.min(100, occupancyRate * patternMultiplier);

    // ── Layer 3: Weather (20%) ──
    let weatherScore = 0;
    if (weatherData) {
      weatherScore = Math.min(100, Math.max(0, (weatherData.temperatureRisk + weatherData.precipitationRisk - 2) * 50));
    }

    // ── Layer 4: Spillover (10%) ──
    let spilloverScore = 0;
    if (allHospitals && allHospitals.length > 0) {
      const nearby = allHospitals.filter(h => {
        if (h.id === hospital.id) return false;
        return haversineKm(hospital.lat, hospital.lng, h.lat, h.lng) < 5;
      });
      const saturated = nearby.filter(h => {
        const t = h.beds.general + h.beds.pediatric + h.beds.fever;
        return t <= 1;
      }).length;
      spilloverScore = Math.min(100, saturated * 15);
    }

    // ── Final ──
    const finalScore =
      occupancyScore * 0.4 +
      patternScore * 0.3 +
      weatherScore * 0.2 +
      spilloverScore * 0.1;

    const probability = Math.max(0, Math.min(100, Math.round(100 - finalScore)));
    const estimatedWaitMin = Math.round((finalScore / 100) * 120);

    const signal: AcceptancePrediction['signal'] =
      probability >= 60 ? 'green' : probability >= 35 ? 'yellow' : 'red';

    // Sources: beds(1), pattern(1), weather(1 if available), spillover(1 if allHospitals provided)
    let sourcesActive = 2; // beds + pattern always available
    if (weatherData && (weatherData.temperatureRisk !== 1 || weatherData.precipitationRisk !== 1)) sourcesActive++;
    else if (weatherData) sourcesActive++; // weather data fetched even if normal
    if (allHospitals && allHospitals.length > 0) sourcesActive++;

    const confidence: AcceptancePrediction['confidence'] =
      sourcesActive >= 3 ? 'high' : sourcesActive === 2 ? 'medium' : 'low';

    // Condition acceptance
    const acc = hospital.acceptance;
    const conditionAcceptance = {
      cardiac: acc?.heart ?? false,
      stroke: acc?.brainBleed ?? false || acc?.brainStroke ?? false,
      trauma: hospital.isTraumaCenter ?? false,
      pediatric: hospital.beds.pediatric > 0,
      dialysis: acc?.dialysis ?? false,
    };

    // If equipment not available, force false
    if (totalBeds <= 0) {
      conditionAcceptance.cardiac = false;
      conditionAcceptance.stroke = false;
      conditionAcceptance.dialysis = false;
    }

    return {
      probability,
      estimatedWaitMin,
      confidence,
      signal,
      breakdown: {
        occupancyScore: Math.round(occupancyScore),
        patternScore: Math.round(patternScore),
        weatherScore: Math.round(weatherScore),
        spilloverScore: Math.round(spilloverScore),
      },
      conditionAcceptance,
      dataFreshness: {
        realtimeConnected: totalBeds > 0 || incomingCount > 0,
        lastUpdated: new Date(),
        sourcesActive,
      },
    };
  }, [hospital, incomingCount, weatherData, allHospitals]);

  // Use edge prediction if available, otherwise local
  const prediction = edgePrediction || localPrediction;

  return {
    data: prediction,
    isLoading: isEdgeLoading && !localPrediction,
    weatherData,
  };
}
