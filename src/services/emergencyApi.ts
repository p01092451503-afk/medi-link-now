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
  // 광역시/특별시/도
  seoul: "서울특별시",
  incheon: "인천광역시",
  gyeonggi: "경기도",
  busan: "부산광역시",
  daegu: "대구광역시",
  daejeon: "대전광역시",
  gwangju: "광주광역시",
  ulsan: "울산광역시",
  sejong: "세종특별자치시",
  gangwon: "강원특별자치도",
  chungbuk: "충청북도",
  chungnam: "충청남도",
  jeonbuk: "전북특별자치도",
  jeonnam: "전라남도",
  gyeongbuk: "경상북도",
  gyeongnam: "경상남도",
  jeju: "제주특별자치도",
  all: "서울특별시", // Default to Seoul for "all"
};

// Sub-region (시/군/구) to parent region mapping for API calls
const subRegionToParent: Record<string, string> = {
  // 서울 구
  "seoul-gangnam": "seoul", "seoul-gangdong": "seoul", "seoul-gangbuk": "seoul", "seoul-gangseo": "seoul",
  "seoul-gwanak": "seoul", "seoul-gwangjin": "seoul", "seoul-guro": "seoul", "seoul-geumcheon": "seoul",
  "seoul-nowon": "seoul", "seoul-dobong": "seoul", "seoul-dongdaemun": "seoul", "seoul-dongjak": "seoul",
  "seoul-mapo": "seoul", "seoul-seodaemun": "seoul", "seoul-seocho": "seoul", "seoul-seongdong": "seoul",
  "seoul-seongbuk": "seoul", "seoul-songpa": "seoul", "seoul-yangcheon": "seoul", "seoul-yeongdeungpo": "seoul",
  "seoul-yongsan": "seoul", "seoul-eunpyeong": "seoul", "seoul-jongno": "seoul", "seoul-jung": "seoul",
  "seoul-jungnang": "seoul",
  // 인천 구/군
  "incheon-jung": "incheon", "incheon-dong": "incheon", "incheon-michuhol": "incheon", "incheon-yeonsu": "incheon",
  "incheon-namdong": "incheon", "incheon-bupyeong": "incheon", "incheon-gyeyang": "incheon", "incheon-seo": "incheon",
  "incheon-ganghwa": "incheon", "incheon-ongjin": "incheon",
  // 경기도 시/군
  "gyeonggi-suwon": "gyeonggi", "gyeonggi-seongnam": "gyeonggi", "gyeonggi-goyang": "gyeonggi", "gyeonggi-yongin": "gyeonggi",
  "gyeonggi-bucheon": "gyeonggi", "gyeonggi-ansan": "gyeonggi", "gyeonggi-anyang": "gyeonggi", "gyeonggi-namyangju": "gyeonggi",
  "gyeonggi-hwaseong": "gyeonggi", "gyeonggi-pyeongtaek": "gyeonggi", "gyeonggi-uijeongbu": "gyeonggi", "gyeonggi-siheung": "gyeonggi",
  "gyeonggi-paju": "gyeonggi", "gyeonggi-gimpo": "gyeonggi", "gyeonggi-gwangmyeong": "gyeonggi", "gyeonggi-gwangju": "gyeonggi",
  "gyeonggi-gunpo": "gyeonggi", "gyeonggi-hanam": "gyeonggi", "gyeonggi-osan": "gyeonggi", "gyeonggi-icheon": "gyeonggi",
  "gyeonggi-anseong": "gyeonggi", "gyeonggi-uiwang": "gyeonggi", "gyeonggi-yangju": "gyeonggi", "gyeonggi-pocheon": "gyeonggi",
  "gyeonggi-yeoju": "gyeonggi", "gyeonggi-dongducheon": "gyeonggi", "gyeonggi-guri": "gyeonggi", "gyeonggi-gwacheon": "gyeonggi",
  "gyeonggi-gapyeong": "gyeonggi", "gyeonggi-yangpyeong": "gyeonggi", "gyeonggi-yeoncheon": "gyeonggi",
  // 부산 구/군
  "busan-jung": "busan", "busan-seo": "busan", "busan-dong": "busan", "busan-yeongdo": "busan",
  "busan-busanjin": "busan", "busan-dongnae": "busan", "busan-nam": "busan", "busan-buk": "busan",
  "busan-haeundae": "busan", "busan-saha": "busan", "busan-geumjeong": "busan", "busan-gangseo": "busan",
  "busan-yeonje": "busan", "busan-suyeong": "busan", "busan-sasang": "busan", "busan-gijang": "busan",
  // 대구 구/군
  "daegu-jung": "daegu", "daegu-dong": "daegu", "daegu-seo": "daegu", "daegu-nam": "daegu",
  "daegu-buk": "daegu", "daegu-suseong": "daegu", "daegu-dalseo": "daegu", "daegu-dalseong": "daegu", "daegu-gunwi": "daegu",
  // 대전 구
  "daejeon-dong": "daejeon", "daejeon-jung": "daejeon", "daejeon-seo": "daejeon", "daejeon-yuseong": "daejeon", "daejeon-daedeok": "daejeon",
  // 광주 구
  "gwangju-dong": "gwangju", "gwangju-seo": "gwangju", "gwangju-nam": "gwangju", "gwangju-buk": "gwangju", "gwangju-gwangsan": "gwangju",
  // 울산 구/군
  "ulsan-jung": "ulsan", "ulsan-nam": "ulsan", "ulsan-dong": "ulsan", "ulsan-buk": "ulsan", "ulsan-ulju": "ulsan",
  // 강원 시
  "gangwon-chuncheon": "gangwon", "gangwon-wonju": "gangwon", "gangwon-gangneung": "gangwon", "gangwon-donghae": "gangwon",
  "gangwon-sokcho": "gangwon", "gangwon-samcheok": "gangwon", "gangwon-taebaek": "gangwon",
  // 충북 시
  "chungbuk-cheongju": "chungbuk", "chungbuk-chungju": "chungbuk", "chungbuk-jecheon": "chungbuk",
  // 충남 시
  "chungnam-cheonan": "chungnam", "chungnam-asan": "chungnam", "chungnam-gongju": "chungnam",
  "chungnam-nonsan": "chungnam", "chungnam-seosan": "chungnam", "chungnam-dangjin": "chungnam",
  // 전북 시
  "jeonbuk-jeonju": "jeonbuk", "jeonbuk-gunsan": "jeonbuk", "jeonbuk-iksan": "jeonbuk",
  "jeonbuk-jeongeup": "jeonbuk", "jeonbuk-namwon": "jeonbuk", "jeonbuk-gimje": "jeonbuk",
  // 전남 시
  "jeonnam-mokpo": "jeonnam", "jeonnam-yeosu": "jeonnam", "jeonnam-suncheon": "jeonnam",
  "jeonnam-naju": "jeonnam", "jeonnam-gwangyang": "jeonnam",
  // 경북 시
  "gyeongbuk-pohang": "gyeongbuk", "gyeongbuk-gyeongju": "gyeongbuk", "gyeongbuk-gimcheon": "gyeongbuk",
  "gyeongbuk-andong": "gyeongbuk", "gyeongbuk-gumi": "gyeongbuk", "gyeongbuk-yeongju": "gyeongbuk",
  "gyeongbuk-sangju": "gyeongbuk", "gyeongbuk-mungyeong": "gyeongbuk", "gyeongbuk-gyeongsan": "gyeongbuk",
  // 경남 시
  "gyeongnam-changwon": "gyeongnam", "gyeongnam-jinju": "gyeongnam", "gyeongnam-tongyeong": "gyeongnam",
  "gyeongnam-sacheon": "gyeongnam", "gyeongnam-gimhae": "gyeongnam", "gyeongnam-miryang": "gyeongnam",
  "gyeongnam-geoje": "gyeongnam", "gyeongnam-yangsan": "gyeongnam",
  // 제주 시
  "jeju-jeju": "jeju", "jeju-seogwipo": "jeju",
};

// Get the parent region for API calls (sub-regions use their parent's API endpoint)
const getApiRegion = (regionId: string): string => {
  const parentRegion = subRegionToParent[regionId];
  return parentRegion || regionId;
};

/**
 * Fetches real-time ER bed data from the Korean Government API via Edge Function
 * Falls back to mock data if API call fails
 */
export const getRealTimeBeds = async (
  regionId: string = "seoul"
): Promise<{ hospitals: Hospital[]; isRealtime: boolean; error?: string }> => {
  try {
    // Get the API region (parent region for sub-regions)
    const apiRegionId = getApiRegion(regionId);
    const city = cityMapping[apiRegionId] || cityMapping.seoul;
    
    console.log(`Fetching real-time ER data for: ${city} (region: ${regionId}, apiRegion: ${apiRegionId})`);

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
