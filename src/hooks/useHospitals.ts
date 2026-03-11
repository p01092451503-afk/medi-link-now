import { useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
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

export type DataSource = "api" | "db" | "cache" | "mock" | "offline";

export interface HospitalWithMeta extends Hospital {
  dataSource?: DataSource;
  reliability?: number;
  isSaturated?: boolean;
  estimatedWaitMinutes?: number;
}

export interface UseHospitalsResult {
  hospitals: HospitalWithMeta[];
  isLoading: boolean;
  isError: boolean;
  isRealtime: boolean;
  source: DataSource;
  lastUpdated: Date | null;
  lastApiRefresh: Date | null;
  refetch: () => void;
}

// localStorage cache helpers
const ER_CACHE_KEY = "er_cache";
const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

interface ErCache {
  data: { hospitals: HospitalWithMeta[]; hasApiData: boolean };
  timestamp: number;
}

function saveToLocalCache(data: { hospitals: HospitalWithMeta[]; hasApiData: boolean }) {
  try {
    const cache: ErCache = { data, timestamp: Date.now() };
    localStorage.setItem(ER_CACHE_KEY, JSON.stringify(cache));
  } catch { /* quota exceeded — ignore */ }
}

function loadFromLocalCache(): ErCache | null {
  try {
    const raw = localStorage.getItem(ER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ErCache;
  } catch {
    return null;
  }
}

// Convert DB hospital to app Hospital format
function dbToHospital(dbHospital: DbHospital): Hospital {
  return {
    id: dbHospital.id,
    name: dbHospital.name_en || dbHospital.name,
    nameKr: dbHospital.name,
    category: dbHospital.category || "응급의료기관",
    lat: dbHospital.lat,
    lng: dbHospital.lng,
    entrance_lat: dbHospital.entrance_lat || undefined,
    entrance_lng: dbHospital.entrance_lng || undefined,
    phone: dbHospital.phone || "",
    address: dbHospital.address,
    beds: { general: 0, pediatric: 0, fever: 0 },
    equipment: dbHospital.equipment || [],
    region: dbHospital.region,
    isTraumaCenter: dbHospital.is_trauma_center || false,
    emergencyGrade: (dbHospital.emergency_grade as Hospital["emergencyGrade"]) || null,
  };
}

// Extract core hospital name for trauma center matching
const extractCoreName = (name: string): string =>
  name
    .replace(/의료법인|재단법인|학교법인|사회복지재단|사회복지|의과대학|부속|의료재단|아산사회복지재단/g, "")
    .replace(/[^가-힣]/g, "");

const TRAUMA_KEY_NAMES = [
  "서울아산", "인하", "서울대", "세브란스", "성모", "을지", "길병원",
  "부산대", "경북대", "충남대", "전남대", "전북대", "조선대", "원주",
  "강원대", "제주대", "경상대", "아주대", "가톨릭",
];

function matchesTraumaCenter(dbName: string, traumaCenters: Hospital[]): boolean {
  const dbCore = extractCoreName(dbName);
  return traumaCenters.some((tc) => {
    const tcCore = extractCoreName(tc.nameKr);
    if (dbName === tc.nameKr) return true;
    if (dbName.includes(tc.nameKr) || tc.nameKr.includes(dbName)) return true;
    if (dbCore.includes(tcCore) || tcCore.includes(dbCore)) return true;
    for (const key of TRAUMA_KEY_NAMES) {
      if (dbName.includes(key) && tc.nameKr.includes(key) && dbName.includes("병원") && tc.nameKr.includes("병원"))
        return true;
    }
    return false;
  });
}

// Estimate wait time for saturated hospitals
function estimateWaitMinutes(beds: { general: number; pediatric: number; fever: number }): number {
  const total = beds.general + beds.pediatric + beds.fever;
  if (total > 0) return 0;
  const overflow = Math.abs(Math.min(0, beds.general));
  return Math.max(30, 20 + overflow * 15);
}

// Core fetch: DB hospitals + bed status + optional API refresh
async function fetchHospitals(): Promise<{
  hospitals: HospitalWithMeta[];
  hasApiData: boolean;
}> {
  // 1. Fetch hospitals from DB
  const { data: dbHospitals, error: dbError } = await supabase
    .from("hospitals")
    .select("*");

  // Build a lookup of static hospital bed data for fallback
  const staticBedMap = new Map(staticHospitals.map((h) => [h.nameKr, h.beds]));

  let mergedHospitals: Hospital[] = [...staticHospitals];

  if (!dbError && dbHospitals && dbHospitals.length > 0) {
    const legallyDesignated = dbHospitals.filter(
      (h: DbHospital) =>
        h.emergency_grade === "regional_center" ||
        h.emergency_grade === "local_center" ||
        h.emergency_grade === "local_institution"
    );

    const dbConverted = legallyDesignated.map((h: DbHospital) => {
      // Preserve static bed data as fallback instead of initializing to 0
      const staticBeds = staticBedMap.get(h.name);
      return {
        ...dbToHospital(h),
        beds: staticBeds || { general: 0, pediatric: 0, fever: 0 },
      };
    });
    const staticByName = new Map(staticHospitals.map((h) => [h.nameKr, h]));
    const staticTraumaCenters = staticHospitals.filter((h) => h.isTraumaCenter === true);

    mergedHospitals = dbConverted.map((dbHosp) => {
      const staticMatch = staticByName.get(dbHosp.nameKr);
      const isTraumaCenter = matchesTraumaCenter(dbHosp.nameKr, staticTraumaCenters) || dbHosp.isTraumaCenter;

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
      return { ...dbHosp, isTraumaCenter };
    });
  }

  // 2. Fetch bed status cache
  const { data: statusData } = await supabase.from("hospital_status_cache").select("*");

  let hasApiData = false;

  if (statusData && statusData.length > 0) {
    hasApiData = true;
    const statusMap = new Map<number, HospitalStatusCache>();
    statusData.forEach((s: HospitalStatusCache) => statusMap.set(s.hospital_id, s));

    mergedHospitals = mergedHospitals.map((hospital) => {
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
  }

  // 3. Add metadata
  const withMeta: HospitalWithMeta[] = mergedHospitals.map((h) => {
    const totalBeds = h.beds.general + h.beds.pediatric + h.beds.fever;
    const isSaturated = totalBeds <= 0;
    return {
      ...h,
      dataSource: hasApiData ? ("api" as DataSource) : ("db" as DataSource),
      reliability: hasApiData ? 95 : 70,
      isSaturated,
      estimatedWaitMinutes: isSaturated ? estimateWaitMinutes(h.beds) : 0,
    };
  });

  return { hospitals: withMeta, hasApiData };
}

export function useHospitals(): UseHospitalsResult {
  const queryClient = useQueryClient();
  const lastApiRefreshRef = useRef<Date | null>(null);

  // Single TanStack Query for all hospital data
  const {
    data,
    isLoading,
    isError,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["hospitals"],
    queryFn: fetchHospitals,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Save to localStorage on successful fetch
  useEffect(() => {
    if (data) {
      saveToLocalCache(data);
    }
  }, [data]);

  // Trigger Edge Function API refresh (only for user's current city)
  const triggerApiRefresh = useCallback(async (city = "서울특별시") => {
    try {
      console.log(`[useHospitals] Triggering API refresh for ${city}...`);
      const { data: result, error } = await supabase.functions.invoke("fetch-er-data", {
        body: { city },
      });
      if (error) {
        console.error("[useHospitals] API refresh error:", error);
      } else if (result?.cached) {
        console.log(`[useHospitals] Cache is fresh (${result.cacheAgeMinutes?.toFixed(1)}min). No API call made.`);
        lastApiRefreshRef.current = new Date();
      } else {
        console.log(`[useHospitals] API refresh success: ${result?.count || 0} hospitals`);
        lastApiRefreshRef.current = new Date();
        queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      }
    } catch (err) {
      console.error("[useHospitals] API refresh failed:", err);
      Sentry.captureException(err, {
        tags: { feature: "api-refresh", source: "edge-function" },
      });
    }
  }, [queryClient]);

  // Polling: refresh every 10 minutes (not 5) to stay within 1000/day quota
  useEffect(() => {
    // Initial refresh
    triggerApiRefresh();

    const POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes
    let pollingId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (pollingId) clearInterval(pollingId);
      pollingId = setInterval(() => triggerApiRefresh(), POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (pollingId) {
        clearInterval(pollingId);
        pollingId = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        triggerApiRefresh();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [triggerApiRefresh]);

  // Realtime subscription for bed status changes
  useEffect(() => {
    const channel = supabase
      .channel("hospital-status-unified")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hospital_status_cache" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["hospitals"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Offline fallback: use localStorage cache when query fails
  const offlineCache = useMemo(() => {
    if (isError || (!data && !isLoading)) {
      return loadFromLocalCache();
    }
    return null;
  }, [isError, data, isLoading]);

  const isOfflineFallback = !data && !!offlineCache;
  const cacheAgeMs = offlineCache ? Date.now() - offlineCache.timestamp : 0;
  const isCacheStale = cacheAgeMs > CACHE_MAX_AGE_MS;

  const hospitals = data?.hospitals
    ?? offlineCache?.data.hospitals?.map(h => ({
        ...h,
        dataSource: "offline" as DataSource,
        reliability: isCacheStale ? 30 : 50,
      }))
    ?? staticHospitals;

  const hasApiData = data?.hasApiData ?? offlineCache?.data.hasApiData ?? false;

  const source: DataSource = isOfflineFallback
    ? "offline"
    : isError
      ? "mock"
      : hasApiData || lastApiRefreshRef.current
        ? "api"
        : dataUpdatedAt
          ? "cache"
          : "mock";

  const lastUpdated = isOfflineFallback && offlineCache
    ? new Date(offlineCache.timestamp)
    : dataUpdatedAt
      ? new Date(dataUpdatedAt)
      : null;

  return {
    hospitals,
    isLoading,
    isError,
    isRealtime: source === "api",
    source,
    lastUpdated,
    lastApiRefresh: lastApiRefreshRef.current,
    refetch: () => { refetch(); },
  };
}
