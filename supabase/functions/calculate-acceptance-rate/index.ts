import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

interface AcceptanceResult {
  hospital_id: number;
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

// Calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Get hospital coordinates
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id, lat, lng, name')
      .eq('id', hospital_id)
      .maybeSingle();

    if (hospitalError || !hospital) {
      console.error('Hospital fetch error:', hospitalError);
      return new Response(
        JSON.stringify({ error: 'Hospital not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Get location logs from the last 3 hours
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { data: logs, error: logsError } = await supabase
      .from('location_logs')
      .select('*')
      .eq('hospital_id', hospital_id)
      .gte('recorded_at', threeHoursAgo)
      .order('recorded_at', { ascending: true });

    if (logsError) {
      console.error('Logs fetch error:', logsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch location logs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Group logs by driver
    const driverLogs: Map<string, LocationLog[]> = new Map();
    (logs || []).forEach((log: LocationLog) => {
      const driverEntries = driverLogs.get(log.driver_id) || [];
      driverEntries.push(log);
      driverLogs.set(log.driver_id, driverEntries);
    });

    let totalEntries = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;

    // Analyze each driver's visit pattern
    for (const [driverId, driverLogList] of driverLogs) {
      const enterLogs = driverLogList.filter(l => l.event_type === 'enter');
      const exitLogs = driverLogList.filter(l => l.event_type === 'exit');
      
      for (const enterLog of enterLogs) {
        totalEntries++;
        
        // Find the corresponding exit (if any)
        const exitAfterEnter = exitLogs.find(exitLog => 
          new Date(exitLog.recorded_at) > new Date(enterLog.recorded_at)
        );
        
        if (!exitAfterEnter) {
          // Still at hospital or no exit recorded - check if stayed long enough
          const lastLog = driverLogList[driverLogList.length - 1];
          const stayDuration = new Date(lastLog.recorded_at).getTime() - new Date(enterLog.recorded_at).getTime();
          
          if (stayDuration >= 30 * 60 * 1000) {
            // Stayed 30+ minutes = accepted
            acceptedCount++;
          }
          // If less than 30 min and no exit, we don't count yet (ongoing visit)
          continue;
        }
        
        // Calculate time between enter and exit
        const exitTime = new Date(exitAfterEnter.recorded_at).getTime();
        const enterTime = new Date(enterLog.recorded_at).getTime();
        const durationMinutes = (exitTime - enterTime) / (60 * 1000);
        
        // Check distance at exit (should be > 500m for rejection)
        const exitDistance = exitAfterEnter.distance_from_hospital || 
          calculateDistance(hospital.lat, hospital.lng, exitAfterEnter.lat, exitAfterEnter.lng);
        
        if (durationMinutes <= 15 && exitDistance > 500) {
          // Left within 15 minutes and moved > 500m away = rejected
          rejectedCount++;
        } else if (durationMinutes >= 30) {
          // Stayed 30+ minutes = accepted
          acceptedCount++;
        }
        // Between 15-30 min or < 500m = inconclusive, don't count
      }
    }

    // Calculate acceptance rate (avoid division by zero)
    const acceptanceRate = totalEntries > 0 
      ? Math.round((acceptedCount / totalEntries) * 100) 
      : 100; // Default to 100% if no data

    // Update cache table
    const { error: upsertError } = await supabase
      .from('hospital_acceptance_stats')
      .upsert({
        hospital_id: hospital_id,
        total_entries: totalEntries,
        accepted_count: acceptedCount,
        rejected_count: rejectedCount,
        acceptance_rate: acceptanceRate,
        last_calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'hospital_id' });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
    }

    const result: AcceptanceResult = {
      hospital_id,
      total_entries: totalEntries,
      accepted_count: acceptedCount,
      rejected_count: rejectedCount,
      acceptance_rate: acceptanceRate,
      recent_analysis: {
        total_vehicles: totalEntries,
        rejected_vehicles: rejectedCount,
        analysis_period_hours: 3
      }
    };

    console.log(`Acceptance rate calculated for hospital ${hospital_id}:`, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error calculating acceptance rate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
