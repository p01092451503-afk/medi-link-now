import { useEffect, useState, useCallback, useRef } from "react";
import { config } from "@/lib/config";
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
  const [isError, setIsError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastApiRefresh, setLastApiRefresh] = useState<Date | null>(null);
  const isMounted = useRef(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Trigger Edge Function to refresh ER data from public API
  const triggerApiRefresh = useCallback(async () => {
    try {
      console.log('[useRealtimeHospitals] Triggering API refresh via fetch-er-data...');
      const { data, error } = await supabase.functions.invoke('fetch-er-data', {
        body: { city: '서울특별시' },
      });
      if (error) {
        console.error('[useRealtimeHospitals] API refresh error:', error);
      } else {
        console.log(`[useRealtimeHospitals] API refresh success: ${data?.count || 0} hospitals`);
        setLastApiRefresh(new Date());
        // Re-fetch from DB to pick up new cache data
        await fetchHospitalData();
      }
    } catch (err) {
      console.error('[useRealtimeHospitals] API refresh failed:', err);
    }
  }, [fetchHospitalData]);

  // Fetch hospitals - merge DB data with static data for fallback
  const fetchHospitalData = useCallback(async () => {
    if (!isMounted.current) return;
    
    setIsLoading(true);
    setIsError(false);
    
    try {
      // Fetch hospitals from DB
      const { data: dbHospitals, error: dbError } = await supabase
        .from('hospitals')
        .select('*');

      // Start with static hospitals
      let mergedHospitals = [...staticHospitals];
      
      // If we have DB hospitals, use only legally designated emergency institutions
      if (!dbError && dbHospitals && dbHospitals.length > 0) {
        console.log(`Fetched ${dbHospitals.length} hospitals from database`);
        
        // Filter to only include legally designated emergency institutions
        const legallyDesignated = dbHospitals.filter((h: DbHospital) => 
          h.emergency_grade === 'regional_center' || 
          h.emergency_grade === 'local_center' || 
          h.emergency_grade === 'local_institution'
        );
        
        console.log(`Filtered to ${legallyDesignated.length} legally designated institutions`);
        
        const dbConverted = legallyDesignated.map((h: DbHospital) => dbToHospital(h));
        
        // Create a map of existing hospitals by name for matching
        const staticByName = new Map(staticHospitals.map(h => [h.nameKr, h]));
        
        // Get trauma centers from static data
        const staticTraumaCenters = staticHospitals.filter(h => h.isTraumaCenter === true);
        
        // Extract core hospital name for matching (remove common prefixes/suffixes)
        const extractCoreName = (name: string): string => {
          return name
            .replace(/의료법인|재단법인|학교법인|사회복지재단|사회복지|의과대학|부속|의료재단/g, '')
            .replace(/아산사회복지재단/g, '') // Remove Asan Foundation prefix specifically
            .replace(/[^가-힣]/g, ''); // Keep only Korean characters
        };
        
        // Helper function to check if DB hospital name matches a trauma center
        // Uses flexible matching for various naming conventions
        const matchesTraumaCenter = (dbName: string): boolean => {
          const dbCore = extractCoreName(dbName);
          
          return staticTraumaCenters.some(tc => {
            const tcCore = extractCoreName(tc.nameKr);
            
            // Exact match
            if (dbName === tc.nameKr) return true;
            // DB name contains static name
            if (dbName.includes(tc.nameKr)) return true;
            // Static name contains DB name
            if (tc.nameKr.includes(dbName)) return true;
            // Core name matching (e.g., "인하대학교병원" core = "인하대학교병원", "인하대학교의과대학부속병원" core = "인하대학교병원")
            if (dbCore.includes(tcCore) || tcCore.includes(dbCore)) return true;
            // Check if both contain the same key institution name
            // '서울아산' is more specific than '아산' to avoid false positives with other Asan hospitals
            const keyNames = ['서울아산', '인하', '서울대', '세브란스', '성모', '을지', '길병원', '부산대', '경북대', '충남대', '전남대', '전북대', '조선대', '원주', '강원대', '제주대', '경상대', '아주대', '가톨릭'];
            for (const key of keyNames) {
              if (dbName.includes(key) && tc.nameKr.includes(key)) {
                // Additional check: both should be major hospitals (regional centers typically)
                if (dbName.includes('병원') && tc.nameKr.includes('병원')) return true;
              }
            }
            return false;
          });
        };
        
        // Use DB data but supplement with static data if coordinates are missing
        // Also inherit trauma center status from static data using partial matching
        mergedHospitals = dbConverted.map(dbHosp => {
          const staticMatch = staticByName.get(dbHosp.nameKr);
          const isTraumaCenter = matchesTraumaCenter(dbHosp.nameKr) || dbHosp.isTraumaCenter;
          
          // If DB hospital has invalid coordinates, use static if available
          if ((!dbHosp.lat || !dbHosp.lng || dbHosp.lat === 37.5665) && staticMatch) {
            return {
              ...dbHosp,
              lat: staticMatch.lat,
              lng: staticMatch.lng,
              entrance_lat: staticMatch.entrance_lat,
              entrance_lng: staticMatch.entrance_lng,
              isTraumaCenter,
            };
          }
          return {
            ...dbHosp,
            isTraumaCenter,
          };
        });
        
        console.log(`Final total: ${mergedHospitals.length} legally designated hospitals`);
        console.log(`Trauma centers found: ${mergedHospitals.filter(h => h.isTraumaCenter).length}`);
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
        setIsError(true);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    // Fetch initial data from DB + trigger API refresh
    fetchHospitalData();
    triggerApiRefresh();

    // 5분 간격 폴링
    const POLL_INTERVAL = 5 * 60 * 1000;
    
    const startPolling = () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        triggerApiRefresh();
      }, POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    // Visibility change: 비활성 시 폴링 중단, 복귀 시 즉시 갱신 + 재시작
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        triggerApiRefresh();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

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
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
      supabase.removeChannel(statusChannel);
    };
  }, [fetchHospitalData, triggerApiRefresh]);

  return {
    hospitals,
    isLoading,
    isError,
    lastUpdated,
    refetch: fetchHospitalData,
  };
};
