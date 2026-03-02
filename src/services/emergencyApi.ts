import { supabase } from "@/integrations/supabase/client";
import { hospitals as mockHospitals, Hospital } from "@/data/hospitals";
import { config } from "@/lib/config";

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
    icuBeds: number;
    medicalIcuBeds: number;
    surgicalIcuBeds: number;
    operatingRooms: number;
    neonatalIcuBeds: number;
    equipment?: {
      ct: boolean;
      mri: boolean;
      angio: boolean;
      ventilator: boolean;
      ecmo: boolean;
      incubator: boolean;
    };
    lat?: number;
    lng?: number;
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
  diagnostics?: {
    reason: string;
    message: string;
    setupGuide: string;
    timestamp: string;
  };
}

/** Individual hospital ER status from ErmctInfoInqireService */
export interface ERStatusData {
  hpid: string;
  hospitalName: string;
  generalBeds: number;
  pediatricBeds: number;
  isolationBeds: number;
  updatedAt: string;
  source: 'api' | 'cache' | 'mock';
  reliability: number; // 0-100
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
  sejong: "세종특별자치시",
  gangwon: "강원특별자치도",
  chungbuk: "충청북도",
  chungnam: "충청남도",
  jeonbuk: "전북특별자치도",
  jeonnam: "전라남도",
  gyeongbuk: "경상북도",
  gyeongnam: "경상남도",
  jeju: "제주특별자치도",
  all: "서울특별시",
};

// Sub-region to parent region mapping
const subRegionToParent: Record<string, string> = {
  "seoul-gangnam": "seoul", "seoul-gangdong": "seoul", "seoul-gangbuk": "seoul", "seoul-gangseo": "seoul",
  "seoul-gwanak": "seoul", "seoul-gwangjin": "seoul", "seoul-guro": "seoul", "seoul-geumcheon": "seoul",
  "seoul-nowon": "seoul", "seoul-dobong": "seoul", "seoul-dongdaemun": "seoul", "seoul-dongjak": "seoul",
  "seoul-mapo": "seoul", "seoul-seodaemun": "seoul", "seoul-seocho": "seoul", "seoul-seongdong": "seoul",
  "seoul-seongbuk": "seoul", "seoul-songpa": "seoul", "seoul-yangcheon": "seoul", "seoul-yeongdeungpo": "seoul",
  "seoul-yongsan": "seoul", "seoul-eunpyeong": "seoul", "seoul-jongno": "seoul", "seoul-jung": "seoul",
  "seoul-jungnang": "seoul",
  "incheon-jung": "incheon", "incheon-dong": "incheon", "incheon-michuhol": "incheon", "incheon-yeonsu": "incheon",
  "incheon-namdong": "incheon", "incheon-bupyeong": "incheon", "incheon-gyeyang": "incheon", "incheon-seo": "incheon",
  "incheon-ganghwa": "incheon", "incheon-ongjin": "incheon",
  "gyeonggi-suwon": "gyeonggi", "gyeonggi-seongnam": "gyeonggi", "gyeonggi-goyang": "gyeonggi", "gyeonggi-yongin": "gyeonggi",
  "gyeonggi-bucheon": "gyeonggi", "gyeonggi-ansan": "gyeonggi", "gyeonggi-anyang": "gyeonggi", "gyeonggi-namyangju": "gyeonggi",
  "gyeonggi-hwaseong": "gyeonggi", "gyeonggi-pyeongtaek": "gyeonggi", "gyeonggi-uijeongbu": "gyeonggi", "gyeonggi-siheung": "gyeonggi",
  "gyeonggi-paju": "gyeonggi", "gyeonggi-gimpo": "gyeonggi", "gyeonggi-gwangmyeong": "gyeonggi", "gyeonggi-gwangju": "gyeonggi",
  "gyeonggi-gunpo": "gyeonggi", "gyeonggi-hanam": "gyeonggi", "gyeonggi-osan": "gyeonggi", "gyeonggi-icheon": "gyeonggi",
  "gyeonggi-anseong": "gyeonggi", "gyeonggi-uiwang": "gyeonggi", "gyeonggi-yangju": "gyeonggi", "gyeonggi-pocheon": "gyeonggi",
  "gyeonggi-yeoju": "gyeonggi", "gyeonggi-dongducheon": "gyeonggi", "gyeonggi-guri": "gyeonggi", "gyeonggi-gwacheon": "gyeonggi",
  "gyeonggi-gapyeong": "gyeonggi", "gyeonggi-yangpyeong": "gyeonggi", "gyeonggi-yeoncheon": "gyeonggi",
  "busan-jung": "busan", "busan-seo": "busan", "busan-dong": "busan", "busan-yeongdo": "busan",
  "busan-busanjin": "busan", "busan-dongnae": "busan", "busan-nam": "busan", "busan-buk": "busan",
  "busan-haeundae": "busan", "busan-saha": "busan", "busan-geumjeong": "busan", "busan-gangseo": "busan",
  "busan-yeonje": "busan", "busan-suyeong": "busan", "busan-sasang": "busan", "busan-gijang": "busan",
  "daegu-jung": "daegu", "daegu-dong": "daegu", "daegu-seo": "daegu", "daegu-nam": "daegu",
  "daegu-buk": "daegu", "daegu-suseong": "daegu", "daegu-dalseo": "daegu", "daegu-dalseong": "daegu", "daegu-gunwi": "daegu",
  "daejeon-dong": "daejeon", "daejeon-jung": "daejeon", "daejeon-seo": "daejeon", "daejeon-yuseong": "daejeon", "daejeon-daedeok": "daejeon",
  "gwangju-dong": "gwangju", "gwangju-seo": "gwangju", "gwangju-nam": "gwangju", "gwangju-buk": "gwangju", "gwangju-gwangsan": "gwangju",
  "ulsan-jung": "ulsan", "ulsan-nam": "ulsan", "ulsan-dong": "ulsan", "ulsan-buk": "ulsan", "ulsan-ulju": "ulsan",
  "gangwon-chuncheon": "gangwon", "gangwon-wonju": "gangwon", "gangwon-gangneung": "gangwon", "gangwon-donghae": "gangwon",
  "gangwon-sokcho": "gangwon", "gangwon-samcheok": "gangwon", "gangwon-taebaek": "gangwon",
  "chungbuk-cheongju": "chungbuk", "chungbuk-chungju": "chungbuk", "chungbuk-jecheon": "chungbuk",
  "chungnam-cheonan": "chungnam", "chungnam-asan": "chungnam", "chungnam-gongju": "chungnam",
  "chungnam-nonsan": "chungnam", "chungnam-seosan": "chungnam", "chungnam-dangjin": "chungnam",
  "jeonbuk-jeonju": "jeonbuk", "jeonbuk-gunsan": "jeonbuk", "jeonbuk-iksan": "jeonbuk",
  "jeonbuk-jeongeup": "jeonbuk", "jeonbuk-namwon": "jeonbuk", "jeonbuk-gimje": "jeonbuk",
  "jeonnam-mokpo": "jeonnam", "jeonnam-yeosu": "jeonnam", "jeonnam-suncheon": "jeonnam",
  "jeonnam-naju": "jeonnam", "jeonnam-gwangyang": "jeonnam",
  "gyeongbuk-pohang": "gyeongbuk", "gyeongbuk-gyeongju": "gyeongbuk", "gyeongbuk-gimcheon": "gyeongbuk",
  "gyeongbuk-andong": "gyeongbuk", "gyeongbuk-gumi": "gyeongbuk", "gyeongbuk-yeongju": "gyeongbuk",
  "gyeongbuk-sangju": "gyeongbuk", "gyeongbuk-mungyeong": "gyeongbuk", "gyeongbuk-gyeongsan": "gyeongbuk",
  "gyeongnam-changwon": "gyeongnam", "gyeongnam-jinju": "gyeongnam", "gyeongnam-tongyeong": "gyeongnam",
  "gyeongnam-sacheon": "gyeongnam", "gyeongnam-gimhae": "gyeongnam", "gyeongnam-miryang": "gyeongnam",
  "gyeongnam-geoje": "gyeongnam", "gyeongnam-yangsan": "gyeongnam",
  "jeju-jeju": "jeju", "jeju-seogwipo": "jeju",
};

const getApiRegion = (regionId: string): string => {
  return subRegionToParent[regionId] || regionId;
};

/**
 * Fetch real-time ER status for a specific hospital by hpid
 * Uses ErmctInfoInqireService API via Edge Function
 * Falls back to cache/mock on error
 */
export const fetchERStatus = async (hpid: string): Promise<ERStatusData> => {
  try {
    const response = await fetch(
      `${config.supabase.url}/functions/v1/fetch-er-data`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.supabase.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hpid }),
      }
    );

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      const item = result.data[0];
      return {
        hpid,
        hospitalName: item.hospitalName,
        generalBeds: item.generalBeds,
        pediatricBeds: item.pediatricBeds,
        isolationBeds: 0,
        updatedAt: new Date().toISOString(),
        source: 'api',
        reliability: 95,
      };
    }

    // Fallback: try cache
    return await fetchERStatusFromCache(hpid);
  } catch (err) {
    console.warn(`[fetchERStatus] API failed for ${hpid}, falling back to cache:`, err);
    return await fetchERStatusFromCache(hpid);
  }
};

/** Fallback: read from hospital_status_cache table */
async function fetchERStatusFromCache(hpid: string): Promise<ERStatusData> {
  try {
    const { data, error } = await supabase
      .from('hospital_status_cache')
      .select('*')
      .eq('hpid', hpid)
      .maybeSingle();

    if (data && !error) {
      const ageMinutes = (Date.now() - new Date(data.last_updated).getTime()) / 60000;
      return {
        hpid,
        hospitalName: '',
        generalBeds: data.general_beds,
        pediatricBeds: data.pediatric_beds,
        isolationBeds: data.isolation_beds,
        updatedAt: data.last_updated,
        source: 'cache',
        reliability: Math.max(10, 80 - Math.floor(ageMinutes)),
      };
    }
  } catch {}

  // Final fallback: mock
  const mock = mockHospitals.find(h => String(h.id) === hpid);
  return {
    hpid,
    hospitalName: mock?.nameKr || '',
    generalBeds: mock?.beds.general ?? 0,
    pediatricBeds: mock?.beds.pediatric ?? 0,
    isolationBeds: 0,
    updatedAt: new Date().toISOString(),
    source: 'mock',
    reliability: 20,
  };
}

/**
 * Fetches real-time ER bed data from the Korean Government API via Edge Function
 * Falls back to mock data if API call fails
 */
export const getRealTimeBeds = async (
  regionId: string = "seoul"
): Promise<{ hospitals: Hospital[]; isRealtime: boolean; error?: string; lastUpdated?: Date; source?: string }> => {
  try {
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
        source: 'mock',
      };
    }

    if (!data?.success || data?.useMockData) {
      if ((data as any)?.diagnostics?.reason === 'API_KEY_NOT_CONFIGURED') {
        console.warn(
          '[FIND-ER] NEDIS API 키 미설정 — Mock 데이터 표시 중\n' +
          '해결: supabase secrets set PUBLIC_DATA_PORTAL_KEY=<키>\n' +
          '상세: supabase/README.md 참고'
        );
      }
      return {
        hospitals: mockHospitals,
        isRealtime: false,
        error: (data as any)?.diagnostics?.message || data?.error || "API 키가 설정되지 않음",
        source: 'mock',
      };
    }

    if (!data.data || data.data.length === 0) {
      return {
        hospitals: mockHospitals,
        isRealtime: false,
        error: "API에서 데이터가 반환되지 않음",
        source: 'mock',
      };
    }

    const transformedHospitals: Hospital[] = data.data.map((item, index) => ({
      id: index + 1000,
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
        icu: item.icuBeds,
        medicalIcu: item.medicalIcuBeds,
        surgicalIcu: item.surgicalIcuBeds,
        operatingRoom: item.operatingRooms,
        neonatalIcu: item.neonatalIcuBeds,
      },
      equipment: item.equipment
        ? Object.entries(item.equipment)
            .filter(([_, v]) => v === true)
            .map(([k]) => k.toUpperCase())
        : [],
      equipmentDetail: item.equipment,
      category: "응급의료기관",
      region: regionId,
      isTraumaCenter: item.isTraumaCenter,
      acceptance: item.acceptance,
      alertMessage: item.alertMessage,
    }));

    return {
      hospitals: transformedHospitals,
      isRealtime: true,
      lastUpdated: new Date(),
      source: 'api',
    };
  } catch (err) {
    console.error("Error in getRealTimeBeds:", err);
    return {
      hospitals: mockHospitals,
      isRealtime: false,
      error: "네트워크 오류",
      source: 'mock',
    };
  }
};

export const getMockHospitals = (regionId?: string): Hospital[] => {
  if (!regionId || regionId === "all") return mockHospitals;
  
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
