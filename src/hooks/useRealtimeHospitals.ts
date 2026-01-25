import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hospitals as staticHospitals, Hospital, HospitalAcceptance } from "@/data/hospitals";

interface DbHospital {
  id: number;
  hpid: string | null;
  name: string;
  name_en: string | null;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  entrance_lat: number | null;
  entrance_lng: number | null;
  category: string | null;
  region: string;
  sub_region: string | null;
  is_trauma_center: boolean | null;
  has_pediatric: boolean | null;
  equipment: string[] | null;
}

interface HospitalStatusCache {
  hospital_id: number;
  hpid?: string;
  general_beds: number;
  pediatric_beds: number;
  isolation_beds: number;
  last_updated: string;
}

// Convert DB hospital to app Hospital format
function dbToHospital(dbHospital: DbHospital): Hospital {
  return {
    id: dbHospital.id,
    name: dbHospital.name_en || dbHospital.name,
    nameKr: dbHospital.name,
    category: dbHospital.category || '응급의료기관',
    lat: dbHospital.lat,
    lng: dbHospital.lng,
    entrance_lat: dbHospital.entrance_lat || undefined,
    entrance_lng: dbHospital.entrance_lng || undefined,
    phone: dbHospital.phone || '',
    address: dbHospital.address,
    beds: {
      general: 0,
      pediatric: 0,
      fever: 0,
    },
    equipment: dbHospital.equipment || [],
    region: dbHospital.region,
    isTraumaCenter: dbHospital.is_trauma_center || false,
  };
}

export const useRealtimeHospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>(staticHospitals);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Fetch hospitals from database
  const fetchHospitalsFromDb = useCallback(async (): Promise<Hospital[]> => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*');

      if (error) {
        console.error('Error fetching hospitals from DB:', error);
        return [];
      }

      if (data && data.length > 0) {
        console.log(`Fetched ${data.length} hospitals from database`);
        setIsDbConnected(true);
        return data.map((h: DbHospital) => dbToHospital(h));
      }

      return [];
    } catch (err) {
      console.error('Error fetching hospitals from DB:', err);
      return [];
    }
  }, []);

  // Merge hospital data with realtime bed status
  const mergeWithBedStatus = useCallback((
    baseHospitals: Hospital[],
    statusData: HospitalStatusCache[]
  ): Hospital[] => {
    const statusMap = new Map<number, HospitalStatusCache>();
    statusData.forEach(s => statusMap.set(s.hospital_id, s));

    return baseHospitals.map(hospital => {
      const status = statusMap.get(hospital.id);
      if (status) {
        return {
          ...hospital,
          beds: {
            general: status.general_beds,
            pediatric: status.pediatric_beds,
            fever: status.isolation_beds,
          },
        };
      }
      return hospital;
    });
  }, []);

  // Fetch initial data
  const fetchHospitalStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      // First, try to get hospitals from database
      const dbHospitals = await fetchHospitalsFromDb();
      
      // Use DB hospitals if available, otherwise fall back to static data
      const baseHospitals = dbHospitals.length > 0 ? dbHospitals : staticHospitals;
      
      // Fetch bed status
      const { data: statusData, error: statusError } = await supabase
        .from("hospital_status_cache")
        .select("*");

      if (statusError) {
        console.error("Error fetching hospital status:", statusError);
        setHospitals(baseHospitals);
        return;
      }

      if (statusData && statusData.length > 0) {
        const merged = mergeWithBedStatus(baseHospitals, statusData);
        setHospitals(merged);
      } else {
        setHospitals(baseHospitals);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching hospital data:", err);
      setHospitals(staticHospitals);
    } finally {
      setIsLoading(false);
    }
  }, [fetchHospitalsFromDb, mergeWithBedStatus]);

  useEffect(() => {
    // Fetch initial data
    fetchHospitalStatus();

    // Subscribe to realtime updates for hospitals table
    const hospitalsChannel = supabase
      .channel("hospitals-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hospitals",
        },
        () => {
          console.log("Hospitals table updated, refetching...");
          fetchHospitalStatus();
        }
      )
      .subscribe();

    // Subscribe to realtime updates for bed status
    const statusChannel = supabase
      .channel("hospital-status-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hospital_status_cache",
        },
        (payload) => {
          console.log("Realtime bed status update received:", payload);
          
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
                        fever: newStatus.isolation_beds,
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
      supabase.removeChannel(hospitalsChannel);
      supabase.removeChannel(statusChannel);
    };
  }, [fetchHospitalStatus]);

  return {
    hospitals,
    isLoading,
    lastUpdated,
    isDbConnected,
    refetch: fetchHospitalStatus,
  };
};
