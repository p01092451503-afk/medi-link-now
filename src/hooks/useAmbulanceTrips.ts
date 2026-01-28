import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface AmbulanceTrip {
  id: string;
  driver_id: string;
  driver_name: string | null;
  destination_hospital_id: number;
  destination_hospital_name: string;
  origin_lat: number | null;
  origin_lng: number | null;
  current_lat: number | null;
  current_lng: number | null;
  status: "en_route" | "arrived" | "cancelled";
  patient_condition: string | null;
  started_at: string;
  estimated_arrival_minutes: number | null;
  ended_at: string | null;
}

interface UseAmbulanceTripsOptions {
  hospitalId?: number;
}

export const useAmbulanceTrips = (options: UseAmbulanceTripsOptions = {}) => {
  const { hospitalId } = options;
  const { user } = useAuth();
  const [trips, setTrips] = useState<AmbulanceTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myActiveTrip, setMyActiveTrip] = useState<AmbulanceTrip | null>(null);

  // Fetch trips
  const fetchTrips = useCallback(async () => {
    try {
      let query = supabase
        .from("active_ambulance_trips")
        .select("*")
        .eq("status", "en_route");

      if (hospitalId) {
        query = query.eq("destination_hospital_id", hospitalId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTrips(data as AmbulanceTrip[] || []);
    } catch (error) {
      console.error("Error fetching ambulance trips:", error);
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  // Fetch my active trip
  const fetchMyActiveTrip = useCallback(async () => {
    if (!user?.id) {
      setMyActiveTrip(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("active_ambulance_trips")
        .select("*")
        .eq("driver_id", user.id)
        .eq("status", "en_route")
        .maybeSingle();

      if (error) throw error;
      setMyActiveTrip(data as AmbulanceTrip | null);
    } catch (error) {
      console.error("Error fetching my active trip:", error);
    }
  }, [user?.id]);

  // Start a trip
  const startTrip = useCallback(async (
    hospitalId: number,
    hospitalName: string,
    driverName?: string,
    patientCondition?: string
  ) => {
    if (!user?.id) {
      toast.error("로그인이 필요합니다");
      return null;
    }

    // Check if already has active trip
    if (myActiveTrip) {
      toast.error("이미 진행 중인 이송이 있습니다");
      return null;
    }

    try {
      // Get current location
      let originLat: number | null = null;
      let originLng: number | null = null;

      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        }).catch(() => null);

        if (position) {
          originLat = position.coords.latitude;
          originLng = position.coords.longitude;
        }
      }

      const { data, error } = await supabase
        .from("active_ambulance_trips")
        .insert({
          driver_id: user.id,
          driver_name: driverName || user.email,
          destination_hospital_id: hospitalId,
          destination_hospital_name: hospitalName,
          origin_lat: originLat,
          origin_lng: originLng,
          current_lat: originLat,
          current_lng: originLng,
          status: "en_route",
          patient_condition: patientCondition,
        })
        .select()
        .single();

      if (error) throw error;

      setMyActiveTrip(data as AmbulanceTrip);
      toast.success(`${hospitalName}으로 이송 시작`);
      return data as AmbulanceTrip;
    } catch (error) {
      console.error("Error starting trip:", error);
      toast.error("이송 시작에 실패했습니다");
      return null;
    }
  }, [user?.id, user?.email, myActiveTrip]);

  // Complete a trip (arrived)
  const completeTrip = useCallback(async () => {
    if (!myActiveTrip) {
      toast.error("진행 중인 이송이 없습니다");
      return false;
    }

    try {
      const { error } = await supabase
        .from("active_ambulance_trips")
        .update({
          status: "arrived",
          ended_at: new Date().toISOString(),
        })
        .eq("id", myActiveTrip.id);

      if (error) throw error;

      toast.success("이송 완료!");
      setMyActiveTrip(null);
      return true;
    } catch (error) {
      console.error("Error completing trip:", error);
      toast.error("이송 완료 처리에 실패했습니다");
      return false;
    }
  }, [myActiveTrip]);

  // Cancel a trip
  const cancelTrip = useCallback(async () => {
    if (!myActiveTrip) return false;

    try {
      const { error } = await supabase
        .from("active_ambulance_trips")
        .update({
          status: "cancelled",
          ended_at: new Date().toISOString(),
        })
        .eq("id", myActiveTrip.id);

      if (error) throw error;

      toast.success("이송이 취소되었습니다");
      setMyActiveTrip(null);
      return true;
    } catch (error) {
      console.error("Error cancelling trip:", error);
      toast.error("이송 취소에 실패했습니다");
      return false;
    }
  }, [myActiveTrip]);

  // Update current location
  const updateLocation = useCallback(async (lat: number, lng: number) => {
    if (!myActiveTrip) return;

    try {
      await supabase
        .from("active_ambulance_trips")
        .update({
          current_lat: lat,
          current_lng: lng,
        })
        .eq("id", myActiveTrip.id);
    } catch (error) {
      console.error("Error updating location:", error);
    }
  }, [myActiveTrip]);

  // Get count for a specific hospital
  const getEnRouteCount = useMemo(() => {
    return (targetHospitalId: number) => {
      return trips.filter(t => t.destination_hospital_id === targetHospitalId && t.status === "en_route").length;
    };
  }, [trips]);

  // Initial fetch
  useEffect(() => {
    fetchTrips();
    fetchMyActiveTrip();
  }, [fetchTrips, fetchMyActiveTrip]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("ambulance-trips-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "active_ambulance_trips",
        },
        (payload) => {
          console.log("Trip update:", payload.eventType);
          fetchTrips();
          
          // Also update my active trip if it was changed
          if (user?.id && (payload.new as any)?.driver_id === user.id) {
            fetchMyActiveTrip();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrips, fetchMyActiveTrip, user?.id]);

  return {
    trips,
    isLoading,
    myActiveTrip,
    startTrip,
    completeTrip,
    cancelTrip,
    updateLocation,
    getEnRouteCount,
    refetch: fetchTrips,
  };
};

// Simpler hook for just getting en-route count for a hospital
export const useHospitalEnRouteCount = (hospitalId: number | string) => {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const numericHospitalId = typeof hospitalId === 'string' ? parseInt(hospitalId, 10) : hospitalId;

  useEffect(() => {
    const fetchCount = async () => {
      if (isNaN(numericHospitalId)) {
        setCount(0);
        setIsLoading(false);
        return;
      }

      try {
        const { count: tripCount, error } = await supabase
          .from("active_ambulance_trips")
          .select("*", { count: "exact", head: true })
          .eq("destination_hospital_id", numericHospitalId)
          .eq("status", "en_route");

        if (error) throw error;
        setCount(tripCount || 0);
      } catch (error) {
        console.error("Error fetching en-route count:", error);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();

    // Subscribe to changes
    const channel = supabase
      .channel(`hospital-trips-${numericHospitalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "active_ambulance_trips",
          filter: `destination_hospital_id=eq.${numericHospitalId}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [numericHospitalId]);

  return { count, isLoading };
};
