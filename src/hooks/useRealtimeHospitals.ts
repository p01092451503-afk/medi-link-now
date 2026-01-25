import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hospitals as staticHospitals, Hospital } from "@/data/hospitals";

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
  emergency_grade: string | null;
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
    emergencyGrade: dbHospital.emergency_grade as Hospital['emergencyGrade'] || null,
  };
}

export const useRealtimeHospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>(staticHospitals);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMounted = useRef(true);

  // Fetch hospitals - merge DB data with static data for fallback
  const fetchHospitalData = useCallback(async () => {
    if (!isMounted.current) return;
    
    setIsLoading(true);
    
    try {
      // Fetch hospitals from DB
      const { data: dbHospitals, error: dbError } = await supabase
        .from('hospitals')
        .select('*');

      // Start with static hospitals
      let mergedHospitals = [...staticHospitals];
      
      // If we have DB hospitals, merge them
      if (!dbError && dbHospitals && dbHospitals.length > 0) {
        console.log(`Fetched ${dbHospitals.length} hospitals from database`);
        
        const dbConverted = dbHospitals.map((h: DbHospital) => dbToHospital(h));
        
        // Create a map of existing hospitals by name for matching
        const staticByName = new Map(staticHospitals.map(h => [h.nameKr, h]));
        const dbByName = new Map(dbConverted.map(h => [h.nameKr, h]));
        
        // Merge: use DB data but supplement with static data if coordinates are missing
        mergedHospitals = dbConverted.map(dbHosp => {
          const staticMatch = staticByName.get(dbHosp.nameKr);
          
          // If DB hospital has invalid coordinates, use static if available
          if ((!dbHosp.lat || !dbHosp.lng || dbHosp.lat === 37.5665) && staticMatch) {
            return {
              ...dbHosp,
              lat: staticMatch.lat,
              lng: staticMatch.lng,
              entrance_lat: staticMatch.entrance_lat,
              entrance_lng: staticMatch.entrance_lng,
            };
          }
          return dbHosp;
        });
        
        // Add static hospitals that aren't in DB
        staticHospitals.forEach(staticHosp => {
          if (!dbByName.has(staticHosp.nameKr)) {
            mergedHospitals.push(staticHosp);
          }
        });
        
        console.log(`Merged total: ${mergedHospitals.length} hospitals`);
      }

      // Fetch bed status
      const { data: statusData } = await supabase
        .from("hospital_status_cache")
        .select("*");

      if (!isMounted.current) return;

      if (statusData && statusData.length > 0) {
        const statusMap = new Map<number, HospitalStatusCache>();
        statusData.forEach((s: HospitalStatusCache) => statusMap.set(s.hospital_id, s));

        const withBedStatus = mergedHospitals.map(hospital => {
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

        setHospitals(withBedStatus);
      } else {
        setHospitals(mergedHospitals);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching hospital data:", err);
      if (isMounted.current) {
        setHospitals(staticHospitals);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    // Fetch initial data
    fetchHospitalData();

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
          if (!isMounted.current) return;
          
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
      isMounted.current = false;
      supabase.removeChannel(statusChannel);
    };
  }, [fetchHospitalData]);

  return {
    hospitals,
    isLoading,
    lastUpdated,
    refetch: fetchHospitalData,
  };
};
