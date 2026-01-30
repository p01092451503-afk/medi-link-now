import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserRole = "guardian" | "driver";

interface UserRoleRow {
  id: string;
  user_id: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

interface UseUserRoleReturn {
  role: UserRole | null;
  isLoading: boolean;
  setRole: (newRole: UserRole) => Promise<{ error: Error | null }>;
  displayName: string | null;
}

export const useUserRole = (): UseUserRoleReturn => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch role on auth state change
  useEffect(() => {
    if (isAuthLoading) return;
    
    if (!user) {
      setRoleState(null);
      setDisplayName(null);
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      setIsLoading(true);
      try {
        // Use raw query since user_roles table is newly created
        const { data, error } = await supabase
          .from("user_roles" as any)
          .select("role, display_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRoleState(null);
          setDisplayName(null);
        } else if (data) {
          const rowData = data as unknown as { role: UserRole; display_name: string | null };
          setRoleState(rowData.role);
          setDisplayName(rowData.display_name);
        } else {
          // No role yet - user needs to select one
          setRoleState(null);
          setDisplayName(null);
        }
      } catch (err) {
        console.error("Unexpected error fetching role:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user, isAuthLoading]);

  // Set or update role
  const setRole = useCallback(async (newRole: UserRole): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error("User not authenticated") };
    }

    try {
      // Check if role exists
      const { data: existing } = await supabase
        .from("user_roles" as any)
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles" as any)
          .update({ role: newRole } as any)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles" as any)
          .insert({ user_id: user.id, role: newRole } as any);

        if (error) throw error;
      }

      setRoleState(newRole);
      return { error: null };
    } catch (err) {
      console.error("Error setting role:", err);
      return { error: err as Error };
    }
  }, [user]);

  return {
    role,
    isLoading: isAuthLoading || isLoading,
    setRole,
    displayName,
  };
};
