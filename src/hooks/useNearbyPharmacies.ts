import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NearbyPharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  dutyTime1s?: string;
  dutyTime1c?: string;
  dutyTime2s?: string;
  dutyTime2c?: string;
  dutyTime3s?: string;
  dutyTime3c?: string;
  dutyTime4s?: string;
  dutyTime4c?: string;
  dutyTime5s?: string;
  dutyTime5c?: string;
  dutyTime6s?: string;
  dutyTime6c?: string;
  dutyTime7s?: string;
  dutyTime7c?: string;
  dutyTime8s?: string;
  dutyTime8c?: string;
  isOpen?: boolean;
  todayOpenTime?: string;
  todayCloseTime?: string;
  distance?: number;
  isNightPharmacy?: boolean;
  is24h?: boolean;
}

export type PharmacyFilterType = "all" | "nightPharmacy";

// Check if pharmacy is currently open based on operating hours
const isPharmacyOpen = (pharmacy: NearbyPharmacy): { isOpen: boolean; openTime?: string; closeTime?: string } => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 100 + currentMinute;
  const dayOfWeek = now.getDay();

  const dayMap: Record<number, { start: keyof NearbyPharmacy; end: keyof NearbyPharmacy }> = {
    1: { start: 'dutyTime1s', end: 'dutyTime1c' },
    2: { start: 'dutyTime2s', end: 'dutyTime2c' },
    3: { start: 'dutyTime3s', end: 'dutyTime3c' },
    4: { start: 'dutyTime4s', end: 'dutyTime4c' },
    5: { start: 'dutyTime5s', end: 'dutyTime5c' },
    6: { start: 'dutyTime6s', end: 'dutyTime6c' },
    0: { start: 'dutyTime7s', end: 'dutyTime7c' },
  };

  const todayFields = dayMap[dayOfWeek];
  if (!todayFields) return { isOpen: false };

  const openTimeStr = pharmacy[todayFields.start] as string | undefined;
  const closeTimeStr = pharmacy[todayFields.end] as string | undefined;

  if (!openTimeStr || !closeTimeStr) {
    if (dayOfWeek === 0) {
      const holidayOpen = pharmacy.dutyTime8s;
      const holidayClose = pharmacy.dutyTime8c;
      if (holidayOpen && holidayClose) {
        const openTime = parseInt(holidayOpen, 10);
        const closeTime = parseInt(holidayClose, 10);
        return {
          isOpen: currentTime >= openTime && currentTime < closeTime,
          openTime: holidayOpen,
          closeTime: holidayClose,
        };
      }
    }
    return { isOpen: false };
  }

  const openTime = parseInt(openTimeStr, 10);
  let closeTime = parseInt(closeTimeStr, 10);

  if (closeTime < openTime) {
    closeTime += 2400;
    if (currentTime < 400) {
      return {
        isOpen: currentTime + 2400 < closeTime,
        openTime: openTimeStr,
        closeTime: closeTimeStr,
      };
    }
  }

  return {
    isOpen: currentTime >= openTime && currentTime < closeTime,
    openTime: openTimeStr,
    closeTime: closeTimeStr,
  };
};

// Check if pharmacy is a night pharmacy (open after 22:00)
const isNightPharmacy = (pharmacy: NearbyPharmacy): boolean => {
  // DB에서 이미 계산된 플래그가 있으면 사용
  if (pharmacy.isNightPharmacy !== undefined) return pharmacy.isNightPharmacy;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayMap: Record<number, keyof NearbyPharmacy> = {
    1: 'dutyTime1c', 2: 'dutyTime2c', 3: 'dutyTime3c',
    4: 'dutyTime4c', 5: 'dutyTime5c', 6: 'dutyTime6c', 0: 'dutyTime7c',
  };
  const closeField = dayMap[dayOfWeek];
  const closeTimeStr = pharmacy[closeField] as string | undefined;
  if (!closeTimeStr) return false;
  const closeTime = parseInt(closeTimeStr, 10);
  return closeTime >= 2200 || closeTime < 400;
};

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Progressive search radii in km
const SEARCH_RADII = [5, 10, 20, 30];

interface UseNearbyPharmaciesOptions {
  enabled?: boolean;
  userLocation?: [number, number] | null;
  filter?: PharmacyFilterType;
}

export const useNearbyPharmacies = ({
  enabled = false,
  userLocation = null,
  filter = "all",
}: UseNearbyPharmaciesOptions) => {
  const [allPharmacies, setAllPharmacies] = useState<NearbyPharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchLocation, setLastFetchLocation] = useState<[number, number] | null>(null);
  const [source, setSource] = useState<string>('none');
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(5);

  const processDbRows = useCallback((rows: any[], lat: number, lng: number): NearbyPharmacy[] => {
    return rows.map((row) => {
      const pharmacy: NearbyPharmacy = {
        id: row.hpid || `pharmacy-${row.id}`,
        name: row.name,
        address: row.address || '',
        phone: row.phone || '',
        lat: row.lat,
        lng: row.lng,
        dutyTime1s: row.duty_time_1s || '',
        dutyTime1c: row.duty_time_1c || '',
        dutyTime2s: row.duty_time_2s || '',
        dutyTime2c: row.duty_time_2c || '',
        dutyTime3s: row.duty_time_3s || '',
        dutyTime3c: row.duty_time_3c || '',
        dutyTime4s: row.duty_time_4s || '',
        dutyTime4c: row.duty_time_4c || '',
        dutyTime5s: row.duty_time_5s || '',
        dutyTime5c: row.duty_time_5c || '',
        dutyTime6s: row.duty_time_6s || '',
        dutyTime6c: row.duty_time_6c || '',
        dutyTime7s: row.duty_time_7s || '',
        dutyTime7c: row.duty_time_7c || '',
        dutyTime8s: row.duty_time_8s || '',
        dutyTime8c: row.duty_time_8c || '',
        isNightPharmacy: row.is_night_pharmacy,
        is24h: row.is_24h,
      };
      const openStatus = isPharmacyOpen(pharmacy);
      const distance = calculateDistance(lat, lng, pharmacy.lat, pharmacy.lng);
      return { ...pharmacy, isOpen: openStatus.isOpen, todayOpenTime: openStatus.openTime, todayCloseTime: openStatus.closeTime, distance };
    });
  }, []);

  const fetchFromDbWithRadius = useCallback(async (lat: number, lng: number, radiusKm: number) => {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const { data, error } = await supabase
      .from('pharmacies')
      .select('*')
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta)
      .limit(500);

    if (error) throw error;
    return data || [];
  }, []);

  const fetchPharmacies = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // 반경을 점진적으로 확장하며 약국 검색
      for (const radiusKm of SEARCH_RADII) {
        console.log(`[useNearbyPharmacies] Searching radius: ${radiusKm}km`);

        const dbData = await fetchFromDbWithRadius(lat, lng, radiusKm);

        if (dbData.length > 0) {
          const processed = processDbRows(dbData, lat, lng);

          // 약국이 있으면 반환 (영업 여부 무관)
          setAllPharmacies(processed);
          setLastFetchLocation([lat, lng]);
          setSearchRadiusKm(radiusKm);
          setSource('db');
          console.log(`[useNearbyPharmacies] DB ${radiusKm}km: ${processed.length} total, ${processed.filter(p => p.isOpen).length} open`);
          return;
        }

        if (radiusKm === SEARCH_RADII[SEARCH_RADII.length - 1]) {
          // 최대 반경에서도 데이터 없음 → Edge Function fallback
          break;
        }
      }

      // 모든 반경에서 DB 데이터 없음 → Edge Function fallback
      console.log('[useNearbyPharmacies] DB empty at all radii, calling Edge Function...');
      const maxRadius = SEARCH_RADII[SEARCH_RADII.length - 1];
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-nearby-pharmacies?lat=${lat}&lng=${lng}&radius=${maxRadius}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const processedPharmacies: NearbyPharmacy[] = result.data.map((p: NearbyPharmacy) => {
          const openStatus = isPharmacyOpen(p);
          const distance = calculateDistance(lat, lng, p.lat, p.lng);
          return { ...p, isOpen: openStatus.isOpen, todayOpenTime: openStatus.openTime, todayCloseTime: openStatus.closeTime, distance };
        });

        setAllPharmacies(processedPharmacies);
        setLastFetchLocation([lat, lng]);
        setSearchRadiusKm(maxRadius);
        setSource(result.source || 'api');
        console.log(`[useNearbyPharmacies] API: ${processedPharmacies.length} pharmacies (source: ${result.source})`);
      } else {
        setAllPharmacies([]);
        setSearchRadiusKm(maxRadius);
        setSource('empty');
        console.log('[useNearbyPharmacies] No pharmacies found from any source');
      }
    } catch (err) {
      console.error('[useNearbyPharmacies] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pharmacies');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFromDbWithRadius, processDbRows]);

  // Fetch when enabled and location changes significantly
  useEffect(() => {
    if (!enabled || !userLocation) {
      setAllPharmacies([]);
      return;
    }

    const [lat, lng] = userLocation;

    if (lastFetchLocation) {
      const distance = calculateDistance(lastFetchLocation[0], lastFetchLocation[1], lat, lng);
      if (distance < 1) return;
    }

    fetchPharmacies(lat, lng);
  }, [enabled, userLocation, fetchPharmacies, lastFetchLocation]);

  // Filter pharmacies - show all, not just open ones
  const filteredPharmacies = useMemo(() => {
    let result = [...allPharmacies];

    switch (filter) {
      case "nightPharmacy":
        result = result.filter(isNightPharmacy);
        break;
    }

    // 영업 중인 약국을 먼저, 그다음 거리순
    result.sort((a, b) => {
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;
      return (a.distance || 0) - (b.distance || 0);
    });
    return result;
  }, [allPharmacies, filter]);

  const refetch = useCallback(() => {
    if (userLocation) {
      setLastFetchLocation(null);
      fetchPharmacies(userLocation[0], userLocation[1]);
    }
  }, [userLocation, fetchPharmacies]);

  return {
    pharmacies: filteredPharmacies,
    allPharmacies,
    isLoading,
    error,
    refetch,
    source,
    searchRadiusKm,
  };
};
