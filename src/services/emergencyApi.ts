import { supabase } from "@/integrations/supabase/client";
import { hospitals as mockHospitals, Hospital } from "@/data/hospitals";

interface ERApiResponse {
  success: boolean;
  data?: {
    hospitalId: string;
    hospitalName: string;
    address: string;
    phone: string;
    generalBeds: number;
    pediatricBeds: number;
    feverBeds: number;
    lat?: number;
    lng?: number;
    // Extended fields
    isTraumaCenter?: boolean;
    acceptance?: {
      heart: boolean;
      brainBleed: boolean;
      brainStroke: boolean;
      endoscopy: boolean;
      dialysis: boolean;
    };
    alertMessage?: string;
  }[];
  count?: number;
  error?: string;
  useMockData?: boolean;
}

// City name mapping to Korean government API format
const cityMapping: Record<string, string> = {
  seoul: "서울특별시",
  incheon: "인천광역시",
  gyeonggi: "경기도",
  busan: "부산광역시",
  daegu: "대구광역시",
  daejeon: "대전광역시",
  gwangju: "광주광역시",
  ulsan: "울산광역시",
  all: "서울특별시", // Default to Seoul for "all"
};

/**
 * Fetches real-time ER bed data from the Korean Government API via Edge Function
 * Falls back to mock data if API call fails
 */
export const getRealTimeBeds = async (
  regionId: string = "seoul"
): Promise<{ hospitals: Hospital[]; isRealtime: boolean; error?: string }> => {
  try {
    const city = cityMapping[regionId] || cityMapping.seoul;
    
    console.log(`Fetching real-time ER data for: ${city}`);

    const { data, error } = await supabase.functions.invoke<ERApiResponse>("fetch-er-data", {
      body: { city },
    });

    if (error) {
      console.error("Edge function error:", error);
      return {
        hospitals: mockHospitals,
        isRealtime: false,
        error: "API 호출 실패, 샘플 데이터를 표시합니다",
      };
    }

    if (!data?.success || data?.useMockData) {
      console.log("API returned useMockData flag or failed:", data?.error);
      return {
        hospitals: mockHospitals,
        isRealtime: false,
        error: data?.error || "API 키가 설정되지 않음",
      };
    }

    if (!data.data || data.data.length === 0) {
      console.log("No data returned from API, using mock data");
      return {
        hospitals: mockHospitals,
        isRealtime: false,
        error: "API에서 데이터가 반환되지 않음",
      };
    }

    // Transform API data to Hospital format
    const transformedHospitals: Hospital[] = data.data.map((item, index) => ({
      id: index + 1000, // Use numeric ID starting from 1000 for API data
      name: item.hospitalName,
      nameKr: item.hospitalName,
      address: item.address || "",
      phone: item.phone || "",
      lat: item.lat || 37.5665,
      lng: item.lng || 126.978,
      beds: {
        general: item.generalBeds,
        pediatric: item.pediatricBeds,
        fever: item.feverBeds,
      },
      equipment: ["CT", "MRI"], // Default equipment since API doesn't provide this
      category: "응급의료기관",
      region: regionId,
      // Extended fields
      isTraumaCenter: item.isTraumaCenter,
      acceptance: item.acceptance,
      alertMessage: item.alertMessage,
    }));

    console.log(`Successfully fetched ${transformedHospitals.length} hospitals from API`);

    return {
      hospitals: transformedHospitals,
      isRealtime: true,
    };
  } catch (err) {
    console.error("Error in getRealTimeBeds:", err);
    return {
      hospitals: mockHospitals,
      isRealtime: false,
      error: "네트워크 오류",
    };
  }
};

/**
 * Get mock hospitals filtered by region (for fallback)
 */
export const getMockHospitals = (regionId?: string): Hospital[] => {
  if (!regionId || regionId === "all") {
    return mockHospitals;
  }
  
  return mockHospitals.filter((h) => {
    const hospitalRegion = h.address.includes("서울") ? "seoul" :
      h.address.includes("인천") ? "incheon" :
      h.address.includes("경기") ? "gyeonggi" :
      h.address.includes("부산") ? "busan" :
      h.address.includes("대구") ? "daegu" :
      h.address.includes("대전") ? "daejeon" :
      h.address.includes("광주") ? "gwangju" :
      h.address.includes("울산") ? "ulsan" : "seoul";
    
    return hospitalRegion === regionId;
  });
};
