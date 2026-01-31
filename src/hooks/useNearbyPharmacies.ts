import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NearbyPharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  // Operating hours by day (HHMM format)
  dutyTime1s?: string; // 월요일 시작
  dutyTime1c?: string; // 월요일 종료
  dutyTime2s?: string; // 화요일 시작
  dutyTime2c?: string; // 화요일 종료
  dutyTime3s?: string; // 수요일 시작
  dutyTime3c?: string; // 수요일 종료
  dutyTime4s?: string; // 목요일 시작
  dutyTime4c?: string; // 목요일 종료
  dutyTime5s?: string; // 금요일 시작
  dutyTime5c?: string; // 금요일 종료
  dutyTime6s?: string; // 토요일 시작
  dutyTime6c?: string; // 토요일 종료
  dutyTime7s?: string; // 일요일 시작
  dutyTime7c?: string; // 일요일 종료
  dutyTime8s?: string; // 공휴일 시작
  dutyTime8c?: string; // 공휴일 종료
  // Computed fields
  isOpen?: boolean;
  todayOpenTime?: string;
  todayCloseTime?: string;
  distance?: number;
}

export type PharmacyFilterType = "all" | "nightPharmacy" | "holidayPharmacy";

// Check if pharmacy is currently open based on operating hours
const isPharmacyOpen = (pharmacy: NearbyPharmacy): { isOpen: boolean; openTime?: string; closeTime?: string } => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 100 + currentMinute; // HHMM format
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Map day of week to duty time fields (API uses 1-7 for Mon-Sun, 8 for holidays)
  const dayMap: Record<number, { start: keyof NearbyPharmacy; end: keyof NearbyPharmacy }> = {
    1: { start: 'dutyTime1s', end: 'dutyTime1c' }, // Monday
    2: { start: 'dutyTime2s', end: 'dutyTime2c' }, // Tuesday
    3: { start: 'dutyTime3s', end: 'dutyTime3c' }, // Wednesday
    4: { start: 'dutyTime4s', end: 'dutyTime4c' }, // Thursday
    5: { start: 'dutyTime5s', end: 'dutyTime5c' }, // Friday
    6: { start: 'dutyTime6s', end: 'dutyTime6c' }, // Saturday
    0: { start: 'dutyTime7s', end: 'dutyTime7c' }, // Sunday
  };

  const todayFields = dayMap[dayOfWeek];
  if (!todayFields) {
    return { isOpen: false };
  }

  const openTimeStr = pharmacy[todayFields.start] as string | undefined;
  const closeTimeStr = pharmacy[todayFields.end] as string | undefined;

  if (!openTimeStr || !closeTimeStr) {
    // If no operating hours for today, check holiday hours for Sunday
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

  // Handle overnight hours (e.g., closes at 0200 means 26:00)
  if (closeTime < openTime) {
    closeTime += 2400;
    if (currentTime < 400) { // Before 4 AM
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
  // Night pharmacy: closes at or after 22:00 (2200)
  return closeTime >= 2200 || closeTime < 400; // After 10 PM or overnight
};

// Check if pharmacy operates on holidays/Sundays
const isHolidayPharmacy = (pharmacy: NearbyPharmacy): boolean => {
  // Has Sunday hours or holiday hours
  return !!(
    (pharmacy.dutyTime7s && pharmacy.dutyTime7c) ||
    (pharmacy.dutyTime8s && pharmacy.dutyTime8c)
  );
};

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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

  const fetchPharmacies = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('fetch-nearby-pharmacies', {
        body: null,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Use query params approach
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-nearby-pharmacies?lat=${lat}&lng=${lng}&numOfRows=200`,
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

      if (result.success && result.data) {
        // Process pharmacies and add computed fields
        const processedPharmacies: NearbyPharmacy[] = result.data.map((p: NearbyPharmacy) => {
          const openStatus = isPharmacyOpen(p);
          const distance = calculateDistance(lat, lng, p.lat, p.lng);
          return {
            ...p,
            isOpen: openStatus.isOpen,
            todayOpenTime: openStatus.openTime,
            todayCloseTime: openStatus.closeTime,
            distance,
          };
        });

        setAllPharmacies(processedPharmacies);
        setLastFetchLocation([lat, lng]);
        console.log(`Loaded ${processedPharmacies.length} pharmacies, ${processedPharmacies.filter(p => p.isOpen).length} currently open`);
      } else {
        throw new Error(result.error || 'Failed to fetch pharmacies');
      }
    } catch (err) {
      console.error('Error fetching pharmacies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pharmacies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when enabled and location changes significantly
  useEffect(() => {
    if (!enabled || !userLocation) {
      setAllPharmacies([]);
      return;
    }

    const [lat, lng] = userLocation;

    // Check if we need to refetch (location moved more than 1km)
    if (lastFetchLocation) {
      const distance = calculateDistance(
        lastFetchLocation[0], lastFetchLocation[1],
        lat, lng
      );
      if (distance < 1) {
        // Location hasn't changed much, skip fetch
        return;
      }
    }

    fetchPharmacies(lat, lng);
  }, [enabled, userLocation, fetchPharmacies, lastFetchLocation]);

  // Filter pharmacies based on current filter and open status
  const filteredPharmacies = useMemo(() => {
    // Only show currently open pharmacies
    let result = allPharmacies.filter(p => p.isOpen);

    // Apply additional filters
    switch (filter) {
      case "nightPharmacy":
        result = result.filter(isNightPharmacy);
        break;
      case "holidayPharmacy":
        result = result.filter(isHolidayPharmacy);
        break;
    }

    // Sort by distance
    result.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return result;
  }, [allPharmacies, filter]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    if (userLocation) {
      setLastFetchLocation(null); // Force refetch
      fetchPharmacies(userLocation[0], userLocation[1]);
    }
  }, [userLocation, fetchPharmacies]);

  return {
    pharmacies: filteredPharmacies,
    allPharmacies,
    isLoading,
    error,
    refetch,
  };
};
