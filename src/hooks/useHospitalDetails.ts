import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HospitalOperatingHours {
  monday?: { start: string; end: string };
  tuesday?: { start: string; end: string };
  wednesday?: { start: string; end: string };
  thursday?: { start: string; end: string };
  friday?: { start: string; end: string };
  saturday?: { start: string; end: string };
  sunday?: { start: string; end: string };
  holiday?: { start: string; end: string };
}

export interface HospitalDetailData {
  hpid: string;
  hospitalName: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  operatingHours: HospitalOperatingHours;
  departments: string[];
  emergencyRoomType?: string;
  hasPediatric: boolean;
  hasNightCare: boolean;
  specialties: {
    isWomenSpecialty: boolean;
    isChildSpecialty: boolean;
    isTraumaCenter: boolean;
  };
  lat?: number;
  lng?: number;
}

interface FetchHospitalDetailsResponse {
  success: boolean;
  data?: HospitalDetailData[];
  count?: number;
  error?: string;
}

/**
 * Fetch detailed hospital information including operating hours and specialties
 */
export function useHospitalDetails(
  options: {
    hpid?: string;
    city?: string;
    district?: string;
    enabled?: boolean;
  } = {}
) {
  const { hpid, city = '서울특별시', district, enabled = true } = options;

  return useQuery({
    queryKey: ['hospital-details', hpid, city, district],
    queryFn: async (): Promise<HospitalDetailData[]> => {
      const { data, error } = await supabase.functions.invoke<FetchHospitalDetailsResponse>(
        'fetch-hospital-details',
        {
          body: { hpid, city, district },
        }
      );

      if (error) {
        console.error('Error fetching hospital details:', error);
        throw error;
      }

      if (!data?.success || !data.data) {
        console.warn('Hospital details API returned no data:', data?.error);
        return [];
      }

      return data.data;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - this data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

/**
 * Get hospitals filtered by specialty type
 */
export function useHospitalsBySpecialty(
  specialtyType: 'women' | 'child' | 'nightCare' | 'pediatric',
  city: string = '서울특별시'
) {
  const { data: hospitals, ...rest } = useHospitalDetails({ city, enabled: true });

  const filteredHospitals = hospitals?.filter((hospital) => {
    switch (specialtyType) {
      case 'women':
        return hospital.specialties.isWomenSpecialty;
      case 'child':
        return hospital.specialties.isChildSpecialty;
      case 'nightCare':
        return hospital.hasNightCare;
      case 'pediatric':
        return hospital.hasPediatric;
      default:
        return true;
    }
  });

  return {
    data: filteredHospitals,
    ...rest,
  };
}

/**
 * Check if a hospital is currently open based on operating hours
 */
export function isHospitalOpen(operatingHours: HospitalOperatingHours): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTime = now.getHours() * 100 + now.getMinutes();

  const dayMapping: Record<number, keyof HospitalOperatingHours> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };

  const todayKey = dayMapping[dayOfWeek];
  const todayHours = operatingHours[todayKey];

  if (!todayHours?.start || !todayHours?.end) {
    return false;
  }

  const startTime = parseInt(todayHours.start.replace(':', ''), 10);
  const endTime = parseInt(todayHours.end.replace(':', ''), 10);

  // Handle overnight hours (e.g., 22:00 - 02:00)
  if (endTime < startTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Format operating hours for display
 */
export function formatOperatingHours(hours: { start: string; end: string } | undefined): string {
  if (!hours?.start || !hours?.end) {
    return '휴무';
  }
  return `${hours.start} - ${hours.end}`;
}
