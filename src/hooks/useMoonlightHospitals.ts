import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MoonlightHospitalInfo {
  dutyName: string;
  dutyAddr: string;
  dutyTel1: string;
  wgs84Lat: number;
  wgs84Lon: number;
  dutyDiv: string;
  dutyDivNam: string;
  hpid: string;
}

interface MoonlightResponse {
  success: boolean;
  data: MoonlightHospitalInfo[];
  source: 'api' | 'fallback';
  totalCount: number;
  error?: string;
}

/**
 * Fetches officially designated 달빛어린이병원 (Moonlight Children's Hospitals)
 * from the 국립중앙의료원 공공데이터 API.
 * 
 * Returns a Set of hospital names for quick lookup.
 */
export const useMoonlightHospitals = () => {
  const query = useQuery<MoonlightResponse>({
    queryKey: ['moonlight-hospitals'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-moonlight-hospitals', {
        body: {},
      });

      if (error) {
        console.error('[useMoonlightHospitals] Edge function error:', error);
        throw error;
      }

      return data as MoonlightResponse;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - moonlight list rarely changes
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  // Build a Set of hospital names for efficient lookup
  const moonlightNames = new Set<string>();
  if (query.data?.data) {
    query.data.data.forEach((h) => {
      if (h.dutyName) {
        // Store the original name
        moonlightNames.add(h.dutyName);
        // Also store cleaned versions for fuzzy matching
        const cleaned = h.dutyName
          .replace(/\(.*?\)/g, '')
          .replace(/의료법인|사단법인|학교법인|재단법인/g, '')
          .trim();
        if (cleaned) moonlightNames.add(cleaned);
      }
    });
  }

  /**
   * Check if a hospital name matches any officially designated 달빛어린이병원.
   * Uses fuzzy matching: checks if either name contains the other's core keywords.
   */
  const isMoonlightHospital = (hospitalName: string): boolean => {
    if (!hospitalName || moonlightNames.size === 0) return false;

    // Direct match
    if (moonlightNames.has(hospitalName)) return true;

    // Clean the input name
    const cleanedInput = hospitalName
      .replace(/\(.*?\)/g, '')
      .replace(/의료법인|사단법인|학교법인|재단법인|의료재단/g, '')
      .trim();

    if (moonlightNames.has(cleanedInput)) return true;

    // Fuzzy matching: check if any moonlight name is contained in the hospital name or vice versa
    for (const name of moonlightNames) {
      // Extract core keywords (2+ char segments)
      const nameCore = name.replace(/병원|대학교|부속|의원/g, '').trim();
      const inputCore = cleanedInput.replace(/병원|대학교|부속|의원/g, '').trim();

      if (nameCore.length >= 2 && inputCore.length >= 2) {
        if (cleanedInput.includes(nameCore) || name.includes(inputCore)) {
          return true;
        }
      }
    }

    return false;
  };

  return {
    moonlightHospitals: query.data?.data || [],
    moonlightNames,
    isMoonlightHospital,
    isLoading: query.isLoading,
    source: query.data?.source || 'unknown',
    totalCount: query.data?.totalCount || 0,
  };
};
