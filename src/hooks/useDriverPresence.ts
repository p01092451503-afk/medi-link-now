import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface DriverPresence {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "available" | "busy" | "offline";
  vehicleType?: string;
  lastUpdated: string;
}

interface UseDriverPresenceOptions {
  trackOwnLocation?: boolean;
  updateIntervalMs?: number;
}

export const useDriverPresence = (options: UseDriverPresenceOptions = {}) => {
  const { trackOwnLocation = false, updateIntervalMs = 10000 } = options;
  const { user } = useAuth();
  const [nearbyDrivers, setNearbyDrivers] = useState<DriverPresence[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Subscribe to driver presence channel
  useEffect(() => {
    const channel = supabase.channel("drivers_presence", {
      config: {
        presence: {
          key: user?.id || `guest_${Date.now()}`,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const drivers: DriverPresence[] = [];

        Object.entries(state).forEach(([_key, presences]) => {
          const presence = (presences as any[])[0];
          if (presence && presence.role === "driver" && presence.status !== "offline") {
            drivers.push({
              id: presence.user_id,
              name: presence.name || "구급대원",
              lat: presence.lat,
              lng: presence.lng,
              status: presence.status || "available",
              vehicleType: presence.vehicleType,
              lastUpdated: presence.lastUpdated,
            });
          }
        });

        setNearbyDrivers(drivers);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("Driver joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("Driver left:", leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to drivers presence channel");
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // Track and broadcast own location (for drivers)
  const startTracking = useCallback((driverInfo: { name: string; vehicleType?: string }) => {
    if (!navigator.geolocation || !channelRef.current || !user?.id) {
      console.error("Cannot start tracking: missing requirements");
      return;
    }

    setIsTracking(true);

    const updateLocation = (position: GeolocationPosition) => {
      const locationData = {
        user_id: user.id,
        role: "driver",
        name: driverInfo.name,
        vehicleType: driverInfo.vehicleType || "ambulance",
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        status: "available" as const,
        lastUpdated: new Date().toISOString(),
      };

      channelRef.current?.track(locationData);
    };

    // Initial position
    navigator.geolocation.getCurrentPosition(updateLocation, console.error, {
      enableHighAccuracy: true,
    });

    // Watch position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocation,
      console.error,
      {
        enableHighAccuracy: true,
        maximumAge: updateIntervalMs,
        timeout: 15000,
      }
    );
  }, [user?.id, updateIntervalMs]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (channelRef.current && user?.id) {
      channelRef.current.untrack();
    }

    setIsTracking(false);
  }, [user?.id]);

  const updateStatus = useCallback((status: "available" | "busy" | "offline") => {
    if (!channelRef.current || !user?.id) return;

    navigator.geolocation.getCurrentPosition((position) => {
      channelRef.current?.track({
        user_id: user.id,
        role: "driver",
        status,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        lastUpdated: new Date().toISOString(),
      });
    });
  }, [user?.id]);

  // Auto start tracking if option is set
  useEffect(() => {
    if (trackOwnLocation && user?.id) {
      startTracking({ name: user.email || "구급대원" });
      return () => stopTracking();
    }
  }, [trackOwnLocation, user?.id, startTracking, stopTracking, user?.email]);

  return {
    nearbyDrivers,
    isTracking,
    startTracking,
    stopTracking,
    updateStatus,
  };
};
