import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      pickup_location,
      pickup_lat,
      pickup_lng,
      destination,
      destination_lat,
      destination_lng,
      patient_name,
      patient_condition,
      estimated_distance_km,
      estimated_fee,
      notes,
      requester_id,
      is_scheduled,
      scheduled_time,
      vehicle_type,
    } = body;

    // 1. Create the dispatch request
    const { data: request, error: insertError } = await supabase
      .from("ambulance_dispatch_requests")
      .insert({
        pickup_location,
        pickup_lat,
        pickup_lng,
        destination: destination || null,
        destination_lat: destination_lat || null,
        destination_lng: destination_lng || null,
        patient_name: patient_name || null,
        patient_condition: patient_condition || null,
        estimated_distance_km: estimated_distance_km || null,
        estimated_fee: estimated_fee || null,
        notes: notes || null,
        requester_id: requester_id || null,
        status: is_scheduled ? "scheduled" : "pending",
        is_scheduled: is_scheduled || false,
        scheduled_time: scheduled_time || null,
        vehicle_type: vehicle_type || "standard",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create request", detail: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Find nearby active drivers within 10km using Haversine approximation
    const { data: activeDrivers, error: driversError } = await supabase
      .from("driver_locations")
      .select("*")
      .eq("is_active", true);

    if (driversError) {
      console.error("Driver search error:", driversError);
    }

    // Calculate distance and filter within 10km
    const nearbyDrivers = (activeDrivers || []).filter((d) => {
      const R = 6371;
      const dLat = ((d.lat - pickup_lat) * Math.PI) / 180;
      const dLng = ((d.lng - pickup_lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((pickup_lat * Math.PI) / 180) *
          Math.cos((d.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return dist <= 10;
    });

    // 3. Broadcast to nearby drivers via Supabase Realtime channel
    if (nearbyDrivers.length > 0 && !is_scheduled) {
      const channel = supabase.channel("dispatch_broadcast");
      await channel.send({
        type: "broadcast",
        event: "new_dispatch",
        payload: {
          request_id: request.id,
          pickup_location,
          pickup_lat,
          pickup_lng,
          destination,
          patient_name,
          patient_condition,
          estimated_fee,
          nearby_driver_ids: nearbyDrivers.map((d) => d.driver_id),
        },
      });
    }

    return new Response(
      JSON.stringify({
        request,
        nearby_drivers_count: nearbyDrivers.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
