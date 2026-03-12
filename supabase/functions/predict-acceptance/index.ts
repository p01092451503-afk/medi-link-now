import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://find-bed-now.lovable.app',
  'https://id-preview--0014984b-817e-4711-bddc-15810d8fceb9.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Simple in-memory cache (per isolate)
const cache = new Map<number, { data: unknown; ts: number }>();
const CACHE_TTL = 60_000; // 60 seconds

// Korean holidays (2025-2026) — simplified
const lunarDates = new Set([
  '2025-01-28','2025-01-29','2025-01-30','2025-10-05','2025-10-06','2025-10-07','2025-10-08',
  '2026-02-16','2026-02-17','2026-02-18','2026-09-24','2026-09-25','2026-09-26',
]);
const holidayDates = new Set([
  ...lunarDates,
  '2025-01-01','2025-03-01','2025-05-05','2025-05-06','2025-06-06','2025-08-15','2025-10-03','2025-10-09','2025-12-25',
  '2026-01-01','2026-03-01','2026-03-02','2026-05-05','2026-05-24','2026-06-06','2026-08-15','2026-10-03','2026-10-09','2026-12-25',
]);

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getTimePatternMultiplier(date: Date): number {
  const ds = formatDate(date);
  const hour = date.getHours();
  const day = date.getDay();
  if (lunarDates.has(ds)) return 1.8;
  if (holidayDates.has(ds)) return 1.5;
  if (day === 0) return 1.4;
  if ((day === 5 || day === 6 || day === 0) && (hour >= 22 || hour < 2)) return 1.6;
  if (day >= 1 && day <= 5) {
    if (hour >= 8 && hour < 10) return 1.3;
    if (hour >= 12 && hour < 13) return 1.1;
  }
  return 1.0;
}

async function fetchWeatherRisk(lat: number, lng: number) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation&timezone=Asia%2FSeoul`);
    if (!res.ok) { await res.text(); return { temperatureRisk: 1.0, precipitationRisk: 1.0 }; }
    const json = await res.json();
    const temp = json.current?.temperature_2m ?? 20;
    const precip = json.current?.precipitation ?? 0;
    let temperatureRisk = 1.0;
    if (temp < -5) temperatureRisk = 1.4;
    else if (temp > 33) temperatureRisk = 1.6;
    else if (temp < 0) temperatureRisk = 1.2;
    else if (temp > 30) temperatureRisk = 1.2;
    let precipitationRisk = 1.0;
    if (precip > 10) precipitationRisk = 1.3;
    else if (precip > 5) precipitationRisk = 1.15;
    return { temperatureRisk, precipitationRisk };
  } catch { return { temperatureRisk: 1.0, precipitationRisk: 1.0 }; }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2-lat1)*Math.PI)/180;
  const dLng = ((lng2-lng1)*Math.PI)/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const { hospital_id } = await req.json();
    if (!hospital_id) {
      return new Response(JSON.stringify({ error: 'hospital_id required' }), { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    // Check cache
    const cached = cache.get(hospital_id);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(JSON.stringify(cached.data), { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch hospital
    const { data: hospital } = await supabase.from('hospitals').select('*').eq('id', hospital_id).single();
    if (!hospital) {
      return new Response(JSON.stringify({ error: 'Hospital not found' }), { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
    }

    // Fetch bed status (including historical acceptance fields)
    const { data: bedStatus } = await supabase.from('hospital_status_cache').select('*').eq('hospital_id', hospital_id).maybeSingle();
    const generalBeds = bedStatus?.general_beds ?? 5;
    const pediatricBeds = bedStatus?.pediatric_beds ?? 0;
    const isolationBeds = bedStatus?.isolation_beds ?? 0;
    const totalBeds = generalBeds + pediatricBeds + isolationBeds;
    const historicalRate = bedStatus?.historical_acceptance_rate as number | null;
    const lastResult = bedStatus?.last_acceptance_result as boolean | null;

    // Incoming ambulances
    const { count: incomingCount } = await supabase
      .from('active_ambulance_trips')
      .select('*', { count: 'exact', head: true })
      .eq('destination_hospital_id', hospital_id)
      .eq('status', 'en_route');

    // Layer 1: Occupancy (weight: 20%, reduced from 40%)
    const maxCapacity = Math.max(totalBeds + 10, 20);
    const available = Math.max(0, totalBeds);
    let occupancyRate = totalBeds <= 0 ? 95 : Math.min(100, ((maxCapacity - available) / maxCapacity) * 100);
    let occupancyScore = occupancyRate;
    if ((incomingCount || 0) >= 3) occupancyScore = Math.min(100, occupancyScore + 15);

    // Layer 2: Time pattern
    const now = new Date();
    const patternMultiplier = getTimePatternMultiplier(now);
    const patternScore = Math.min(100, occupancyRate * patternMultiplier);

    // Layer 3: Weather
    const weather = await fetchWeatherRisk(hospital.lat, hospital.lng);
    const weatherScore = Math.min(100, Math.max(0, (weather.temperatureRisk + weather.precipitationRisk - 2) * 50));

    // Layer 4: Spillover
    const { data: nearbyHospitals } = await supabase
      .from('hospitals')
      .select('id, lat, lng')
      .neq('id', hospital_id);
    const nearby = (nearbyHospitals || []).filter(h => haversineKm(hospital.lat, hospital.lng, h.lat, h.lng) < 5);
    let saturatedCount = 0;
    if (nearby.length > 0) {
      const nearbyIds = nearby.map(h => h.id);
      const { data: nearbyBeds } = await supabase
        .from('hospital_status_cache')
        .select('hospital_id, general_beds, pediatric_beds, isolation_beds')
        .in('hospital_id', nearbyIds);
      saturatedCount = (nearbyBeds || []).filter(b => (b.general_beds + b.pediatric_beds + b.isolation_beds) <= 1).length;
    }
    const spilloverScore = Math.min(100, saturatedCount * 15);

    // Layer 5: Historical acceptance (weight: 20%, new)
    // historicalRate is 0.0~1.0 from the trigger; convert to 0~100 rejection pressure
    let historicalScore = 50; // neutral default when no data
    if (historicalRate !== null && historicalRate !== undefined) {
      // Higher acceptance rate → lower rejection pressure score
      historicalScore = Math.round((1 - historicalRate) * 100);
      // Boost/penalize based on most recent result
      if (lastResult === false) historicalScore = Math.min(100, historicalScore + 10);
      else if (lastResult === true) historicalScore = Math.max(0, historicalScore - 5);
    }

    // Final — updated weights: occupancy 20%, pattern 20%, weather 10%, spillover 10%, historical 40%
    const finalScore = occupancyScore * 0.2 + patternScore * 0.2 + weatherScore * 0.1 + spilloverScore * 0.1 + historicalScore * 0.4;
    const probability = Math.max(0, Math.min(100, Math.round(100 - finalScore)));
    const estimatedWaitMin = Math.round((finalScore / 100) * 120);
    const signal = probability >= 60 ? 'green' : probability >= 35 ? 'yellow' : 'red';

    let sourcesActive = 2;
    if (weather.temperatureRisk !== 1 || weather.precipitationRisk !== 1) sourcesActive++;
    else sourcesActive++;
    if (nearby.length > 0) sourcesActive++;
    if (historicalRate !== null) sourcesActive++;
    const confidence = sourcesActive >= 4 ? 'high' : sourcesActive >= 3 ? 'medium' : 'low';

    const hasPediatric = pediatricBeds > 0 || (hospital.has_pediatric ?? false);
    const equipment = hospital.equipment || [];

    const result = {
      probability,
      estimatedWaitMin,
      confidence,
      signal,
      breakdown: {
        occupancyScore: Math.round(occupancyScore),
        patternScore: Math.round(patternScore),
        weatherScore: Math.round(weatherScore),
        spilloverScore: Math.round(spilloverScore),
        historicalScore: Math.round(historicalScore),
      },
      conditionAcceptance: {
        cardiac: totalBeds > 0,
        stroke: totalBeds > 0,
        trauma: hospital.is_trauma_center ?? false,
        pediatric: hasPediatric,
        dialysis: totalBeds > 0,
      },
      dataFreshness: {
        realtimeConnected: true,
        lastUpdated: new Date().toISOString(),
        sourcesActive,
      },
    };

    cache.set(hospital_id, { data: result, ts: Date.now() });

    return new Response(JSON.stringify(result), { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('predict-acceptance error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  }
});
