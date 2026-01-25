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
  const isMounted = useRef(true);

  // Fetch hospitals from database and merge with bed status
  const fetchHospitalData = useCallback(async () => {
    if (!isMounted.current) return;
    
    setIsLoading(true);
    
    try {
      // Fetch hospitals from DB
      const { data: dbHospitals, error: dbError } = await supabase
        .from('hospitals')
        .select('*');

      let baseHospitals: Hospital[];
      
      if (dbError || !dbHospitals || dbHospitals.length === 0) {
        console.log('Using static hospitals data');
        baseHospitals = staticHospitals;
      } else {
        console.log(`Fetched ${dbHospitals.length} hospitals from database`);
        baseHospitals = dbHospitals.map((h: DbHospital) => dbToHospital(h));
      }

      // Fetch bed status
      const { data: statusData } = await supabase
        .from("hospital_status_cache")
        .select("*");

      if (!isMounted.current) return;

      if (statusData && statusData.length > 0) {
        const statusMap = new Map<number, HospitalStatusCache>();
        statusData.forEach((s: HospitalStatusCache) => statusMap.set(s.hospital_id, s));

        const merged = baseHospitals.map(hospital => {
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

        setHospitals(merged);
      } else {
        setHospitals(baseHospitals);
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
