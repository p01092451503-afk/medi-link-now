import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const ROLE_KEY = "find-er-user-role";

/**
 * Hybrid onboarding sync: localStorage → DB when user logs in
 * Syncs role and family member data collected during onboarding.
 */
export function useOnboardingSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const syncRole = async () => {
      const localRole = localStorage.getItem(ROLE_KEY);
      if (!localRole) return;

      // Check if user already has a role in DB
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        // Only guardian can be self-registered per RLS
        if (localRole === "guardian") {
          await supabase.from("user_roles").insert({
            user_id: user.id,
            role: "guardian" as const,
          });
        }
      }
    };

    const syncFamilyMembers = async () => {
      const raw = localStorage.getItem("familyMembers");
      if (!raw) return;

      try {
        const members = JSON.parse(raw) as Array<{
          name: string;
          relation: string;
          bloodType: string;
          age: number;
        }>;

        if (members.length === 0) return;

        // Check if user already has family members in DB
        const { data: existing } = await supabase
          .from("family_members")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (existing && existing.length > 0) {
          // Already synced, clear localStorage
          localStorage.removeItem("familyMembers");
          return;
        }

        // Insert each member
        for (const member of members) {
          await supabase.from("family_members").insert({
            user_id: user.id,
            name: member.name,
            relation: member.relation,
            blood_type: member.bloodType || "unknown",
            age: member.age || 0,
          });
        }

        // Clear localStorage after successful sync
        localStorage.removeItem("familyMembers");
      } catch {
        // Invalid JSON, clear it
        localStorage.removeItem("familyMembers");
      }
    };

    syncRole();
    syncFamilyMembers();
  }, [user]);
}
