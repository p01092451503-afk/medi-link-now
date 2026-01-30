import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TrackedAmbulance {
  id: string;
  driver_id: string;
  driver_name: string | null;
  destination_hospital_name: string;
  current_lat: number | null;
  current_lng: number | null;
  status: "en_route" | "arrived" | "cancelled";
  estimated_arrival_minutes: number | null;
  started_at: string;
  patient_condition: string | null;
}

export const useGuardianAmbulanceTracking = () => {
  const { user } = useAuth();
  const [trackedAmbulance, setTrackedAmbulance] = useState<TrackedAmbulance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTrackedAmbulance(null);
      setIsLoading(false);
      return;
    }

    // Fetch any active dispatch requests for this user
    const fetchTrackedAmbulance = async () => {
      setIsLoading(true);
      try {
        // First, find if user has an accepted dispatch request
        const { data: dispatchData, error: dispatchError } = await supabase
          .from("ambulance_dispatch_requests")
          .select("driver_id, status")
          .eq("requester_id", user.id)
          .in("status", ["accepted", "en_route"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dispatchError) {
          console.error("Error fetching dispatch request:", dispatchError);
          setIsLoading(false);
          return;
        }

        if (!dispatchData || !dispatchData.driver_id) {
          setTrackedAmbulance(null);
          setIsLoading(false);
          return;
        }

        // Fetch the driver's active trip
        const { data: tripData, error: tripError } = await supabase
          .from("active_ambulance_trips")
          .select("*")
          .eq("driver_id", dispatchData.driver_id)
          .eq("status", "en_route")
          .maybeSingle();

        if (tripError) {
          console.error("Error fetching ambulance trip:", tripError);
        }

        if (tripData) {
          setTrackedAmbulance({
            id: tripData.id,
            driver_id: tripData.driver_id,
            driver_name: tripData.driver_name,
            destination_hospital_name: tripData.destination_hospital_name,
            current_lat: tripData.current_lat,
            current_lng: tripData.current_lng,
            status: tripData.status as TrackedAmbulance["status"],
            estimated_arrival_minutes: tripData.estimated_arrival_minutes,
            started_at: tripData.started_at,
            patient_condition: tripData.patient_condition,
          });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackedAmbulance();

    // Subscribe to realtime updates on active_ambulance_trips
    const channel = supabase
      .channel("guardian-ambulance-tracking")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "active_ambulance_trips",
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const trip = payload.new as TrackedAmbulance;
            // Only update if this is the tracked ambulance
            if (trackedAmbulance && trip.id === trackedAmbulance.id) {
              setTrackedAmbulance({
                id: trip.id,
                driver_id: trip.driver_id,
                driver_name: trip.driver_name,
                destination_hospital_name: trip.destination_hospital_name,
                current_lat: trip.current_lat,
                current_lng: trip.current_lng,
                status: trip.status,
                estimated_arrival_minutes: trip.estimated_arrival_minutes,
                started_at: trip.started_at,
                patient_condition: trip.patient_condition,
              });
            }
          } else if (payload.eventType === "DELETE") {
            if (trackedAmbulance && payload.old?.id === trackedAmbulance.id) {
              setTrackedAmbulance(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    trackedAmbulance,
    isLoading,
  };
};
