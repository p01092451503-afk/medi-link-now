import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PredictionFactors {
  bed_availability_score: number;
  time_pattern_score: number;
  nearby_competition_score: number;
  weather_score: number;
  historical_acceptance_score: number;
}

export interface AcceptancePrediction {
  hospital_id: number;
  acceptance_probability: number;
  estimated_wait_minutes: number;
  confidence: 'high' | 'medium' | 'low';
  factors: PredictionFactors;
  forecast_30min: number;
  total_entries: number;
  accepted_count: number;
  rejected_count: number;
  acceptance_rate: number;
  recent_analysis: {
    total_vehicles: number;
    rejected_vehicles: number;
    analysis_period_hours: number;
  };
}

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

export function getAcceptanceColor(status: AcceptanceStatus): {
  bg: string;
  text: string;
  border: string;
} {
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

export function useAcceptancePrediction(hospitalId: number | undefined) {
  return useQuery({
    queryKey: ['acceptance-prediction', hospitalId],
    queryFn: async (): Promise<AcceptancePrediction | null> => {
      if (!hospitalId) return null;

      // Try cache first
      const { data: cached, error: cacheError } = await supabase
        .from('hospital_acceptance_stats')
        .select('*')
        .eq('hospital_id', hospitalId)
        .maybeSingle();

      if (cached && !cacheError) {
        const lastCalc = new Date(cached.last_calculated_at);
        const isRecent = (Date.now() - lastCalc.getTime()) < 3 * 60 * 1000;

        if (isRecent) {
          return {
            hospital_id: cached.hospital_id,
            acceptance_probability: cached.acceptance_rate,
            estimated_wait_minutes: cached.acceptance_rate >= 70 ? 15 : cached.acceptance_rate >= 40 ? 35 : 75,
            confidence: cached.total_entries >= 5 ? 'high' : cached.total_entries >= 2 ? 'medium' : 'low',
            factors: {
              bed_availability_score: 50,
              time_pattern_score: 50,
              nearby_competition_score: 50,
              weather_score: 50,
              historical_acceptance_score: cached.acceptance_rate,
            },
            forecast_30min: cached.acceptance_rate,
            total_entries: cached.total_entries,
            accepted_count: cached.accepted_count,
            rejected_count: cached.rejected_count,
            acceptance_rate: cached.acceptance_rate,
            recent_analysis: {
              total_vehicles: cached.total_entries,
              rejected_vehicles: cached.rejected_count,
              analysis_period_hours: 3,
            },
          };
        }
      }

      // Fetch fresh prediction from edge function
      try {
        const { data, error } = await supabase.functions.invoke('calculate-acceptance-rate', {
          body: { hospital_id: hospitalId },
        });

        if (error) {
          console.error('Prediction edge function error:', error);
          if (cached) {
            return {
              hospital_id: cached.hospital_id,
              acceptance_probability: cached.acceptance_rate,
              estimated_wait_minutes: 30,
              confidence: 'low' as const,
              factors: {
                bed_availability_score: 50,
                time_pattern_score: 50,
                nearby_competition_score: 50,
                weather_score: 50,
                historical_acceptance_score: cached.acceptance_rate,
              },
              forecast_30min: cached.acceptance_rate,
              total_entries: cached.total_entries,
              accepted_count: cached.accepted_count,
              rejected_count: cached.rejected_count,
              acceptance_rate: cached.acceptance_rate,
              recent_analysis: {
                total_vehicles: cached.total_entries,
                rejected_vehicles: cached.rejected_count,
                analysis_period_hours: 3,
              },
            };
          }
          return null;
        }

        return data as AcceptancePrediction;
      } catch (err) {
        console.error('Failed to fetch prediction:', err);
        return null;
      }
    },
    enabled: !!hospitalId,
    staleTime: 3 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
  });
}
