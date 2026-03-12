import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://find-er.kr',
  'https://www.find-er.kr',
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's token to get their ID
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Use service role to delete user data and auth account
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data from all tables (cascade will handle some, but be explicit)
    const userId = user.id;
    
    await Promise.allSettled([
      adminClient.from("family_members").delete().eq("user_id", userId),
      adminClient.from("driving_logs").delete().eq("driver_id", userId),
      adminClient.from("hospital_rejection_logs").delete().eq("driver_id", userId),
      adminClient.from("hospital_live_reports").delete().eq("reporter_id", userId),
      adminClient.from("location_logs").delete().eq("driver_id", userId),
      adminClient.from("driver_locations").delete().eq("driver_id", userId),
      adminClient.from("reviews").delete().eq("reviewer_id", userId),
      adminClient.from("bids").delete().eq("driver_id", userId),
      adminClient.from("active_ambulance_trips").delete().eq("driver_id", userId),
      adminClient.from("user_roles").delete().eq("user_id", userId),
    ]);

    // Delete the auth user (this is permanent)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Log the deletion
    await adminClient.from("system_audit_logs").insert({
      action_type: "account_deletion",
      action_detail: `User ${userId} self-deleted their account`,
      performed_by: userId,
      success: true,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
