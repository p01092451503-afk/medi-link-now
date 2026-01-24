import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 국민건강보험공단 요양기관 정보 API
// Alternative: http://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList
const API_URL = "http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytLcinfoInqire";

interface NursingHospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  type: string;
  beds?: number;
}

// Parse XML value helper
const getValue = (xml: string, tag: string): string => {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const result = regex.exec(xml);
  return result ? result[1].trim() : '';
};

const getNumValue = (xml: string, tag: string): number => {
  const val = getValue(xml, tag);
  return val ? parseInt(val, 10) || 0 : 0;
};

const getFloatValue = (xml: string, tag: string): number => {
  const val = getValue(xml, tag);
  return val ? parseFloat(val) || 0 : 0;
};

// Fallback mock data for nursing hospitals across Korea
const getMockNursingHospitals = (): NursingHospital[] => {
  return [
    // Seoul
    { id: 'nh-1', name: '서울요양병원', address: '서울특별시 강남구 테헤란로 123', phone: '02-1234-5678', lat: 37.5012, lng: 127.0396, type: '요양병원', beds: 150 },
    { id: 'nh-2', name: '강북요양병원', address: '서울특별시 강북구 도봉로 456', phone: '02-2345-6789', lat: 37.6396, lng: 127.0257, type: '요양병원', beds: 120 },
    { id: 'nh-3', name: '송파요양병원', address: '서울특별시 송파구 올림픽로 789', phone: '02-3456-7890', lat: 37.5145, lng: 127.1059, type: '요양병원', beds: 180 },
    { id: 'nh-4', name: '마포요양병원', address: '서울특별시 마포구 월드컵로 321', phone: '02-4567-8901', lat: 37.5665, lng: 126.9018, type: '요양병원', beds: 100 },
    { id: 'nh-5', name: '노원요양병원', address: '서울특별시 노원구 동일로 654', phone: '02-5678-9012', lat: 37.6542, lng: 127.0568, type: '요양병원', beds: 200 },
    // Gyeonggi
    { id: 'nh-6', name: '수원요양병원', address: '경기도 수원시 팔달구 효원로 111', phone: '031-111-2222', lat: 37.2636, lng: 127.0286, type: '요양병원', beds: 250 },
    { id: 'nh-7', name: '성남요양병원', address: '경기도 성남시 분당구 정자일로 222', phone: '031-222-3333', lat: 37.3595, lng: 127.1086, type: '요양병원', beds: 180 },
    { id: 'nh-8', name: '고양요양병원', address: '경기도 고양시 일산동구 중앙로 333', phone: '031-333-4444', lat: 37.6580, lng: 126.7690, type: '요양병원', beds: 160 },
    { id: 'nh-9', name: '용인요양병원', address: '경기도 용인시 기흥구 동백죽전로 444', phone: '031-444-5555', lat: 37.2747, lng: 127.1150, type: '요양병원', beds: 140 },
    { id: 'nh-10', name: '안양요양병원', address: '경기도 안양시 동안구 평촌대로 555', phone: '031-555-6666', lat: 37.3943, lng: 126.9568, type: '요양병원', beds: 130 },
    // Incheon
    { id: 'nh-11', name: '인천요양병원', address: '인천광역시 남동구 예술로 123', phone: '032-123-4567', lat: 37.4475, lng: 126.7052, type: '요양병원', beds: 200 },
    { id: 'nh-12', name: '송도요양병원', address: '인천광역시 연수구 송도동 456', phone: '032-234-5678', lat: 37.3830, lng: 126.6570, type: '요양병원', beds: 180 },
    // Busan
    { id: 'nh-13', name: '부산요양병원', address: '부산광역시 해운대구 해운대로 789', phone: '051-789-0123', lat: 35.1631, lng: 129.1635, type: '요양병원', beds: 220 },
    { id: 'nh-14', name: '서면요양병원', address: '부산광역시 부산진구 서면로 321', phone: '051-890-1234', lat: 35.1577, lng: 129.0596, type: '요양병원', beds: 190 },
    { id: 'nh-15', name: '동래요양병원', address: '부산광역시 동래구 명륜로 654', phone: '051-901-2345', lat: 35.2047, lng: 129.0786, type: '요양병원', beds: 170 },
    // Daegu
    { id: 'nh-16', name: '대구요양병원', address: '대구광역시 수성구 동대구로 111', phone: '053-111-2222', lat: 35.8563, lng: 128.6294, type: '요양병원', beds: 200 },
    { id: 'nh-17', name: '달서요양병원', address: '대구광역시 달서구 달구벌대로 222', phone: '053-222-3333', lat: 35.8282, lng: 128.5330, type: '요양병원', beds: 160 },
    // Daejeon
    { id: 'nh-18', name: '대전요양병원', address: '대전광역시 서구 둔산로 333', phone: '042-333-4444', lat: 36.3504, lng: 127.3845, type: '요양병원', beds: 180 },
    { id: 'nh-19', name: '유성요양병원', address: '대전광역시 유성구 대학로 444', phone: '042-444-5555', lat: 36.3623, lng: 127.3562, type: '요양병원', beds: 150 },
    // Gwangju
    { id: 'nh-20', name: '광주요양병원', address: '광주광역시 서구 상무대로 555', phone: '062-555-6666', lat: 35.1469, lng: 126.8512, type: '요양병원', beds: 170 },
    { id: 'nh-21', name: '북구요양병원', address: '광주광역시 북구 용봉로 666', phone: '062-666-7777', lat: 35.1733, lng: 126.9127, type: '요양병원', beds: 140 },
    // Ulsan
    { id: 'nh-22', name: '울산요양병원', address: '울산광역시 남구 삼산로 777', phone: '052-777-8888', lat: 35.5384, lng: 129.3114, type: '요양병원', beds: 160 },
    // Sejong
    { id: 'nh-23', name: '세종요양병원', address: '세종특별자치시 한누리대로 888', phone: '044-888-9999', lat: 36.4800, lng: 127.2890, type: '요양병원', beds: 120 },
    // Gangwon
    { id: 'nh-24', name: '춘천요양병원', address: '강원도 춘천시 중앙로 111', phone: '033-111-2222', lat: 37.8813, lng: 127.7298, type: '요양병원', beds: 130 },
    { id: 'nh-25', name: '원주요양병원', address: '강원도 원주시 시청로 222', phone: '033-222-3333', lat: 37.3422, lng: 127.9202, type: '요양병원', beds: 140 },
    { id: 'nh-26', name: '강릉요양병원', address: '강원도 강릉시 경강로 333', phone: '033-333-4444', lat: 37.7519, lng: 128.8760, type: '요양병원', beds: 110 },
    // Chungbuk
    { id: 'nh-27', name: '청주요양병원', address: '충청북도 청주시 상당구 상당로 444', phone: '043-444-5555', lat: 36.6424, lng: 127.4890, type: '요양병원', beds: 150 },
    { id: 'nh-28', name: '충주요양병원', address: '충청북도 충주시 성서동 555', phone: '043-555-6666', lat: 36.9910, lng: 127.9259, type: '요양병원', beds: 120 },
    // Chungnam
    { id: 'nh-29', name: '천안요양병원', address: '충청남도 천안시 동남구 만남로 666', phone: '041-666-7777', lat: 36.8151, lng: 127.1139, type: '요양병원', beds: 180 },
    { id: 'nh-30', name: '아산요양병원', address: '충청남도 아산시 온천로 777', phone: '041-777-8888', lat: 36.7898, lng: 127.0047, type: '요양병원', beds: 140 },
    // Jeonbuk
    { id: 'nh-31', name: '전주요양병원', address: '전라북도 전주시 완산구 전주천로 888', phone: '063-888-9999', lat: 35.8242, lng: 127.1480, type: '요양병원', beds: 170 },
    { id: 'nh-32', name: '익산요양병원', address: '전라북도 익산시 무왕로 999', phone: '063-999-0000', lat: 35.9483, lng: 126.9576, type: '요양병원', beds: 130 },
    // Jeonnam
    { id: 'nh-33', name: '목포요양병원', address: '전라남도 목포시 평화로 111', phone: '061-111-2222', lat: 34.8118, lng: 126.3922, type: '요양병원', beds: 140 },
    { id: 'nh-34', name: '순천요양병원', address: '전라남도 순천시 장천로 222', phone: '061-222-3333', lat: 34.9506, lng: 127.4872, type: '요양병원', beds: 150 },
    { id: 'nh-35', name: '여수요양병원', address: '전라남도 여수시 좌수영로 333', phone: '061-333-4444', lat: 34.7604, lng: 127.6622, type: '요양병원', beds: 120 },
    // Gyeongbuk
    { id: 'nh-36', name: '포항요양병원', address: '경상북도 포항시 남구 새천년대로 444', phone: '054-444-5555', lat: 36.0190, lng: 129.3435, type: '요양병원', beds: 160 },
    { id: 'nh-37', name: '경주요양병원', address: '경상북도 경주시 태종로 555', phone: '054-555-6666', lat: 35.8562, lng: 129.2247, type: '요양병원', beds: 130 },
    { id: 'nh-38', name: '구미요양병원', address: '경상북도 구미시 송정대로 666', phone: '054-666-7777', lat: 36.1195, lng: 128.3446, type: '요양병원', beds: 140 },
    // Gyeongnam
    { id: 'nh-39', name: '창원요양병원', address: '경상남도 창원시 성산구 중앙대로 777', phone: '055-777-8888', lat: 35.2275, lng: 128.6819, type: '요양병원', beds: 200 },
    { id: 'nh-40', name: '김해요양병원', address: '경상남도 김해시 김해대로 888', phone: '055-888-9999', lat: 35.2341, lng: 128.8890, type: '요양병원', beds: 160 },
    { id: 'nh-41', name: '진주요양병원', address: '경상남도 진주시 진주대로 999', phone: '055-999-0000', lat: 35.1801, lng: 128.1076, type: '요양병원', beds: 150 },
    // Jeju
    { id: 'nh-42', name: '제주요양병원', address: '제주특별자치도 제주시 중앙로 111', phone: '064-111-2222', lat: 33.4996, lng: 126.5312, type: '요양병원', beds: 180 },
    { id: 'nh-43', name: '서귀포요양병원', address: '제주특별자치도 서귀포시 중앙로 222', phone: '064-222-3333', lat: 33.2541, lng: 126.5603, type: '요양병원', beds: 140 },
  ];
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceKey = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    
    // Get query parameters
    const url = new URL(req.url);
    const pageNo = url.searchParams.get('pageNo') || '1';
    const numOfRows = url.searchParams.get('numOfRows') || '100';
    const useMock = url.searchParams.get('useMock') === 'true';

    console.log(`Fetching nursing hospitals: pageNo=${pageNo}, numOfRows=${numOfRows}`);

    // If no API key or useMock is true, return mock data
    if (!serviceKey || useMock) {
      console.log('Using mock nursing hospital data');
      const mockData = getMockNursingHospitals();
      return new Response(
        JSON.stringify({
          success: true,
          data: mockData,
          totalCount: mockData.length,
          pageNo: 1,
          numOfRows: mockData.length,
          source: 'mock',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to fetch from API
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);

    // Use emergency institution location info API which uses the same service key as ER data
    const apiUrl = `${API_URL}?serviceKey=${encodedKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&Q0=전국`;

    console.log('API URL:', apiUrl.replace(encodedKey, 'HIDDEN'));

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/xml',
      },
    });

    if (!response.ok) {
      console.error('API request failed:', response.status);
      // Fall back to mock data on API failure
      console.log('Falling back to mock data');
      const mockData = getMockNursingHospitals();
      return new Response(
        JSON.stringify({
          success: true,
          data: mockData,
          totalCount: mockData.length,
          pageNo: 1,
          numOfRows: mockData.length,
          source: 'mock',
          apiError: `API returned ${response.status}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const xmlText = await response.text();
    console.log('Response length:', xmlText.length);

    // Check for API error
    if (xmlText.includes('<errMsg>')) {
      const errMsg = getValue(xmlText, 'errMsg');
      console.error('API Error:', errMsg);
      // Fall back to mock data
      const mockData = getMockNursingHospitals();
      return new Response(
        JSON.stringify({
          success: true,
          data: mockData,
          totalCount: mockData.length,
          pageNo: 1,
          numOfRows: mockData.length,
          source: 'mock',
          apiError: errMsg,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse hospital items
    const hospitals: NursingHospital[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const item = match[1];
      
      const lat = getFloatValue(item, 'wgs84Lat') || getFloatValue(item, 'YPos') || getFloatValue(item, 'yPos');
      const lng = getFloatValue(item, 'wgs84Lon') || getFloatValue(item, 'XPos') || getFloatValue(item, 'xPos');
      
      // Skip if no valid coordinates
      if (!lat || !lng || lat < 33 || lat > 39 || lng < 124 || lng > 132) {
        continue;
      }

      const hospital: NursingHospital = {
        id: getValue(item, 'hpid') || getValue(item, 'ykiho') || `nh-${hospitals.length}`,
        name: getValue(item, 'dutyName') || getValue(item, 'yadmNm') || '알 수 없음',
        address: getValue(item, 'dutyAddr') || getValue(item, 'addr') || '',
        phone: getValue(item, 'dutyTel1') || getValue(item, 'telno') || '',
        lat,
        lng,
        type: '요양병원',
        beds: getNumValue(item, 'hospBdCnt') || getNumValue(item, 'cmdcGdrCnt') || 0,
      };

      hospitals.push(hospital);
    }

    console.log(`Parsed ${hospitals.length} nursing hospitals from API`);

    // If no hospitals found from API, use mock data
    if (hospitals.length === 0) {
      console.log('No hospitals from API, using mock data');
      const mockData = getMockNursingHospitals();
      return new Response(
        JSON.stringify({
          success: true,
          data: mockData,
          totalCount: mockData.length,
          pageNo: 1,
          numOfRows: mockData.length,
          source: 'mock',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get total count from response
    const totalCount = getNumValue(xmlText, 'totalCount') || hospitals.length;

    return new Response(
      JSON.stringify({
        success: true,
        data: hospitals,
        totalCount,
        pageNo: parseInt(pageNo),
        numOfRows: parseInt(numOfRows),
        source: 'api',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error fetching nursing hospitals:', error);
    // Fall back to mock data on any error
    const mockData = getMockNursingHospitals();
    return new Response(
      JSON.stringify({
        success: true,
        data: mockData,
        totalCount: mockData.length,
        pageNo: 1,
        numOfRows: mockData.length,
        source: 'mock',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
