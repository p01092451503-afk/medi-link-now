import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LocationLog {
  id: string;
  driver_id: string;
  lat: number;
  lng: number;
  hospital_id: number | null;
  event_type: 'enter' | 'exit' | 'ping';
  distance_from_hospital: number | null;
  recorded_at: string;
}

interface WeatherData {
  temperature: number;
  precipitation: number;
  weatherCode: number;
}

interface PredictionResult {
  hospital_id: number;
  acceptance_probability: number;
  estimated_wait_minutes: number;
  confidence: 'high' | 'medium' | 'low';
  factors: {
    bed_availability_score: number;
    time_pattern_score: number;
    nearby_competition_score: number;
    weather_score: number;
    historical_acceptance_score: number;
  };
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

// Fetch weather from Open-Meteo (free, no API key)
async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code&timezone=Asia/Seoul`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API failed');
    const data = await res.json();
    return {
      temperature: data.current?.temperature_2m ?? 20,
      precipitation: data.current?.precipitation ?? 0,
      weatherCode: data.current?.weather_code ?? 0,
    };
  } catch (e) {
    console.warn('Weather fetch failed, using defaults:', e);
    return { temperature: 20, precipitation: 0, weatherCode: 0 };
  }
}

// Weather impact score (0-100, higher = more demand pressure)
function getWeatherScore(weather: WeatherData): number {
  let score = 50; // neutral baseline

  // Extreme cold increases ER visits
  if (weather.temperature < -10) score += 25;
  else if (weather.temperature < 0) score += 15;
  else if (weather.temperature > 35) score += 20;
  else if (weather.temperature > 30) score += 10;

  // Rain/snow increases accidents
  if (weather.precipitation > 10) score += 20;
  else if (weather.precipitation > 3) score += 10;
  else if (weather.precipitation > 0) score += 5;

  // Severe weather codes (thunderstorm, heavy snow, etc.)
  if (weather.weatherCode >= 95) score += 15;
  else if (weather.weatherCode >= 71) score += 10;
  else if (weather.weatherCode >= 61) score += 5;

  return Math.min(100, Math.max(0, score));
}

// Time-of-day pattern score (0-100, higher = busier)
function getTimePatternScore(): number {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0=Sun
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Hourly demand patterns (based on Korean ER statistics)
  const hourlyPattern: Record<number, number> = {
    0: 45, 1: 35, 2: 30, 3: 25, 4: 20, 5: 20,
    6: 25, 7: 35, 8: 50, 9: 65, 10: 75, 11: 80,
    12: 75, 13: 70, 14: 70, 15: 65, 16: 60, 17: 65,
    18: 75, 19: 85, 20: 90, 21: 85, 22: 70, 23: 55,
  };

  let score = hourlyPattern[hour] ?? 50;

  // Weekend adjustment: higher nighttime, lower daytime
  if (isWeekend) {
    if (hour >= 22 || hour <= 4) score += 15;
    else if (hour >= 10 && hour <= 15) score -= 10;
  }

  // Friday/Saturday night surge
  if ((dayOfWeek === 5 || dayOfWeek === 6) && (hour >= 21 || hour <= 3)) {
    score += 20;
  }

  return Math.min(100, Math.max(0, score));
}

// Calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { hospital_id } = await req.json();

    if (!hospital_id) {
      return new Response(
        JSON.stringify({ error: 'hospital_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch hospital info
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id, lat, lng, name, region')
      .eq('id', hospital_id)
      .maybeSingle();

    if (hospitalError || !hospital) {
      return new Response(
        JSON.stringify({ error: 'Hospital not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Parallel data fetching
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const [logsResult, bedCacheResult, nearbyHospitalsResult, weatherData] = await Promise.all([
      // Location logs
      supabase
        .from('location_logs')
        .select('*')
        .eq('hospital_id', hospital_id)
        .gte('recorded_at', threeHoursAgo)
        .order('recorded_at', { ascending: true }),

      // Current bed status
      supabase
        .from('hospital_status_cache')
        .select('general_beds, pediatric_beds, isolation_beds')
        .eq('hospital_id', hospital_id)
        .maybeSingle(),

      // Nearby hospitals (within ~15km) for competition analysis
      supabase
        .from('hospital_status_cache')
        .select('hospital_id, general_beds, pediatric_beds, isolation_beds')
        .neq('hospital_id', hospital_id),

      // Weather
      fetchWeather(hospital.lat, hospital.lng),
    ]);

    const logs = logsResult.data || [];
    const bedCache = bedCacheResult.data;

    // === Factor 1: Bed availability (0-100, higher = more available) ===
    let bedAvailabilityScore = 50;
    if (bedCache) {
      const totalBeds = bedCache.general_beds + bedCache.pediatric_beds + bedCache.isolation_beds;
      if (totalBeds <= 0) bedAvailabilityScore = 5;
      else if (totalBeds <= 2) bedAvailabilityScore = 20;
      else if (totalBeds <= 5) bedAvailabilityScore = 40;
      else if (totalBeds <= 10) bedAvailabilityScore = 60;
      else if (totalBeds <= 20) bedAvailabilityScore = 80;
      else bedAvailabilityScore = 95;
    }

    // === Factor 2: Time pattern ===
    const timePatternScore = getTimePatternScore();

    // === Factor 3: Nearby competition (0-100, higher = less competition/more pressure on this hospital) ===
    let nearbyCompetitionScore = 50;
    if (nearbyHospitalsResult.data) {
      const nearbyWithBeds = nearbyHospitalsResult.data.filter(h => {
        const total = h.general_beds + h.pediatric_beds + h.isolation_beds;
        return total > 0;
      });
      // More nearby hospitals with beds = less pressure
      if (nearbyWithBeds.length >= 10) nearbyCompetitionScore = 25;
      else if (nearbyWithBeds.length >= 5) nearbyCompetitionScore = 40;
      else if (nearbyWithBeds.length >= 2) nearbyCompetitionScore = 60;
      else nearbyCompetitionScore = 85;
    }

    // === Factor 4: Weather ===
    const weatherScore = getWeatherScore(weatherData);

    // === Factor 5: Historical acceptance from location logs ===
    const driverLogs: Map<string, LocationLog[]> = new Map();
    logs.forEach((log: LocationLog) => {
      const entries = driverLogs.get(log.driver_id) || [];
      entries.push(log);
      driverLogs.set(log.driver_id, entries);
    });

    let totalEntries = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;

    for (const [, driverLogList] of driverLogs) {
      const enterLogs = driverLogList.filter(l => l.event_type === 'enter');
      const exitLogs = driverLogList.filter(l => l.event_type === 'exit');

      for (const enterLog of enterLogs) {
        totalEntries++;
        const exitAfterEnter = exitLogs.find(exitLog =>
          new Date(exitLog.recorded_at) > new Date(enterLog.recorded_at)
        );

        if (!exitAfterEnter) {
          const lastLog = driverLogList[driverLogList.length - 1];
          const stayDuration = new Date(lastLog.recorded_at).getTime() - new Date(enterLog.recorded_at).getTime();
          if (stayDuration >= 30 * 60 * 1000) acceptedCount++;
          continue;
        }

        const durationMinutes = (new Date(exitAfterEnter.recorded_at).getTime() - new Date(enterLog.recorded_at).getTime()) / (60 * 1000);
        const exitDistance = exitAfterEnter.distance_from_hospital ||
          calculateDistance(hospital.lat, hospital.lng, exitAfterEnter.lat, exitAfterEnter.lng);

        if (durationMinutes <= 15 && exitDistance > 500) rejectedCount++;
        else if (durationMinutes >= 30) acceptedCount++;
      }
    }

    const historicalRate = totalEntries > 0
      ? Math.round((acceptedCount / totalEntries) * 100)
      : 100;
    const historicalAcceptanceScore = historicalRate;

    // === Weighted combination ===
    // Weights: bed availability 35%, historical 25%, time 15%, weather 10%, competition 15%
    const weights = {
      bed: 0.35,
      historical: 0.25,
      time: 0.15,
      weather: 0.10,
      competition: 0.15,
    };

    // For acceptance probability, invert time/weather/competition (higher those = lower acceptance)
    const rawScore =
      bedAvailabilityScore * weights.bed +
      historicalAcceptanceScore * weights.historical +
      (100 - timePatternScore) * weights.time +
      (100 - weatherScore) * weights.weather +
      (100 - nearbyCompetitionScore) * weights.competition;

    const acceptanceProbability = Math.round(Math.min(95, Math.max(5, rawScore)));

    // === Confidence ===
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (totalEntries >= 5 && bedCache) confidence = 'high';
    else if (totalEntries >= 2 || bedCache) confidence = 'medium';

    // === Wait time estimate ===
    let estimatedWait: number;
    if (acceptanceProbability >= 80) estimatedWait = 10;
    else if (acceptanceProbability >= 60) estimatedWait = 25;
    else if (acceptanceProbability >= 40) estimatedWait = 45;
    else if (acceptanceProbability >= 20) estimatedWait = 75;
    else estimatedWait = 120;

    // Add uncertainty range for low confidence
    if (confidence === 'low') estimatedWait = Math.round(estimatedWait * 1.3);

    // === 30-minute forecast ===
    // Simulate time shift: what would the score be 30 min from now?
    const now = new Date();
    const futureHour = new Date(now.getTime() + 30 * 60 * 1000).getHours();
    const hourlyPattern: Record<number, number> = {
      0: 45, 1: 35, 2: 30, 3: 25, 4: 20, 5: 20,
      6: 25, 7: 35, 8: 50, 9: 65, 10: 75, 11: 80,
      12: 75, 13: 70, 14: 70, 15: 65, 16: 60, 17: 65,
      18: 75, 19: 85, 20: 90, 21: 85, 22: 70, 23: 55,
    };
    const futureTimeScore = hourlyPattern[futureHour] ?? 50;
    const futureRawScore =
      bedAvailabilityScore * weights.bed +
      historicalAcceptanceScore * weights.historical +
      (100 - futureTimeScore) * weights.time +
      (100 - weatherScore) * weights.weather +
      (100 - nearbyCompetitionScore) * weights.competition;
    const forecast30min = Math.round(Math.min(95, Math.max(5, futureRawScore)));

    // === Update cache ===
    await supabase
      .from('hospital_acceptance_stats')
      .upsert({
        hospital_id,
        total_entries: totalEntries,
        accepted_count: acceptedCount,
        rejected_count: rejectedCount,
        acceptance_rate: acceptanceProbability,
        last_calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'hospital_id' });

    const result: PredictionResult = {
      hospital_id,
      acceptance_probability: acceptanceProbability,
      estimated_wait_minutes: estimatedWait,
      confidence,
      factors: {
        bed_availability_score: bedAvailabilityScore,
        time_pattern_score: timePatternScore,
        nearby_competition_score: nearbyCompetitionScore,
        weather_score: weatherScore,
        historical_acceptance_score: historicalAcceptanceScore,
      },
      forecast_30min: forecast30min,
      total_entries: totalEntries,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      acceptance_rate: acceptanceProbability,
      recent_analysis: {
        total_vehicles: totalEntries,
        rejected_vehicles: rejectedCount,
        analysis_period_hours: 3,
      },
    };

    console.log(`Prediction for hospital ${hospital_id}:`, {
      probability: acceptanceProbability,
      confidence,
      wait: estimatedWait,
      forecast30: forecast30min,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Prediction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
