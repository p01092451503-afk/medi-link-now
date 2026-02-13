import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useDriverLocation = () => {
  const { user } = useAuth();
  const [isCallWaiting, setIsCallWaiting] = useState(false);

  // Upsert driver location and active status
  const updateLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!user?.id) return;
      await supabase.from("driver_locations").upsert(
        {
          driver_id: user.id,
          lat,
          lng,
          is_active: isCallWaiting,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "driver_id" }
      );
    },
    [user?.id, isCallWaiting]
  );

  // Toggle call waiting mode
  const toggleCallWaiting = useCallback(
    async (active: boolean) => {
      setIsCallWaiting(active);
      if (!user?.id) return;

      // Get current position
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await supabase.from("driver_locations").upsert(
              {
                driver_id: user.id,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                is_active: active,
                last_updated: new Date().toISOString(),
              },
              { onConflict: "driver_id" }
            );
          },
          () => {
            // Fallback: just update active status
            supabase.from("driver_locations").upsert(
              {
                driver_id: user.id,
                lat: 0,
                lng: 0,
                is_active: active,
                last_updated: new Date().toISOString(),
              },
              { onConflict: "driver_id" }
            );
          }
        );
      }
    },
    [user?.id]
  );

  // Auto-update location while call waiting is on
  useEffect(() => {
    if (!isCallWaiting || !user?.id) return;

    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [isCallWaiting, user?.id, updateLocation]);

  return { isCallWaiting, toggleCallWaiting };
};
