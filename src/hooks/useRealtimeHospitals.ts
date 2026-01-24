import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hospitals as staticHospitals, Hospital } from "@/data/hospitals";

interface HospitalStatusCache {
  hospital_id: number;
  general_beds: number;
  pediatric_beds: number;
  isolation_beds: number; // DB still uses isolation_beds, we map it to fever
  last_updated: string;
}

export const useRealtimeHospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>(staticHospitals);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Merge static hospital data with realtime bed data
  const mergeHospitalData = useCallback((statusData: HospitalStatusCache[]) => {
    const statusMap = new Map(
      statusData.map((s) => [s.hospital_id, s])
    );

    const merged = staticHospitals.map((hospital) => {
      const status = statusMap.get(hospital.id);
      if (status) {
        return {
          ...hospital,
          beds: {
            general: status.general_beds,
            pediatric: status.pediatric_beds,
            fever: status.isolation_beds, // Map isolation_beds from DB to fever
          },
        };
      }
      return hospital;
    });

    setHospitals(merged);
    setLastUpdated(new Date());
  }, []);

  // Fetch initial data
  const fetchHospitalStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("hospital_status_cache")
        .select("*");

      if (error) {
        console.error("Error fetching hospital status:", error);
        return;
      }

      if (data && data.length > 0) {
        mergeHospitalData(data);
      }
    } catch (err) {
      console.error("Error fetching hospital status:", err);
    } finally {
      setIsLoading(false);
    }
  }, [mergeHospitalData]);

  useEffect(() => {
    // Fetch initial data
    fetchHospitalStatus();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("hospital-status-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hospital_status_cache",
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const newStatus = payload.new as HospitalStatusCache;
            
            setHospitals((prev) =>
              prev.map((hospital) =>
                hospital.id === newStatus.hospital_id
                  ? {
                      ...hospital,
                      beds: {
                        general: newStatus.general_beds,
                        pediatric: newStatus.pediatric_beds,
                        fever: newStatus.isolation_beds, // Map isolation_beds to fever
                      },
                    }
                  : hospital
              )
            );
            setLastUpdated(new Date());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchHospitalStatus]);

  return {
    hospitals,
    isLoading,
    lastUpdated,
    refetch: fetchHospitalStatus,
  };
};
