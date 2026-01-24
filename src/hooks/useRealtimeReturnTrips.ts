import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ReturnTripRequest {
  id: string;
  patient_name: string;
  pickup_location: string;
  pickup_city: string;
  destination: string;
  destination_city: string;
  estimated_fee: number;
  distance: string;
  patient_condition: string | null;
  patient_age: string | null;
  patient_gender: string | null;
  status: string;
  accepted_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useRealtimeReturnTrips = () => {
  const [trips, setTrips] = useState<ReturnTripRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial data
  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from("return_trip_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setTrips(data || []);
    } catch (err) {
      console.error("Error fetching return trips:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Accept a trip
  const acceptTrip = async (tripId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "로그인이 필요합니다",
          variant: "destructive",
        });
        return false;
      }

      const { error: updateError } = await supabase
        .from("return_trip_requests")
        .update({ 
          status: "accepted",
          accepted_by: user.id 
        })
        .eq("id", tripId)
        .eq("status", "pending"); // Only update if still pending

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error("Error accepting trip:", err);
      toast({
        title: "수락에 실패했습니다",
        description: "다시 시도해주세요",
        variant: "destructive",
      });
      return false;
    }
  };

  // Create a new trip request
  const createTrip = async (trip: Omit<ReturnTripRequest, "id" | "status" | "accepted_by" | "created_at" | "updated_at">) => {
    try {
      const { error: insertError } = await supabase
        .from("return_trip_requests")
        .insert([trip]);

      if (insertError) throw insertError;
      return true;
    } catch (err) {
      console.error("Error creating trip:", err);
      return false;
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchTrips();

    // Set up realtime subscription
    const channel = supabase
      .channel("return_trips_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "return_trip_requests",
        },
        (payload) => {
          console.log("New trip received:", payload);
          const newTrip = payload.new as ReturnTripRequest;
          if (newTrip.status === "pending") {
            setTrips((prev) => [newTrip, ...prev]);
            toast({
              title: "🔔 새로운 귀경길 콜!",
              description: `${newTrip.pickup_city} → ${newTrip.destination_city}`,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "return_trip_requests",
        },
        (payload) => {
          console.log("Trip updated:", payload);
          const updatedTrip = payload.new as ReturnTripRequest;
          
          if (updatedTrip.status !== "pending") {
            // Remove from list if no longer pending
            setTrips((prev) => prev.filter((t) => t.id !== updatedTrip.id));
          } else {
            // Update in list
            setTrips((prev) =>
              prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "return_trip_requests",
        },
        (payload) => {
          console.log("Trip deleted:", payload);
          const deletedTrip = payload.old as ReturnTripRequest;
          setTrips((prev) => prev.filter((t) => t.id !== deletedTrip.id));
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    trips,
    isLoading,
    error,
    acceptTrip,
    createTrip,
    refetch: fetchTrips,
  };
};
