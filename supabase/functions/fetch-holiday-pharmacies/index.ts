import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 국립중앙의료원 전국 약국 정보 조회 서비스 API
const API_URL = "http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire";

interface HolidayPharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  mondayOpen?: string;
  mondayClose?: string;
  holidayOpen?: string;
  holidayClose?: string;
}

// Parse XML value helper
const getValue = (xml: string, tag: string): string => {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const result = regex.exec(xml);
  return result ? result[1].trim() : '';
};

const getFloatValue = (xml: string, tag: string): number => {
  const val = getValue(xml, tag);
  return val ? parseFloat(val) || 0 : 0;
};

// Fallback mock data for holiday pharmacies across Korea
const getMockHolidayPharmacies = (): HolidayPharmacy[] => {
  return [
    // 서울
    { id: 'hp-1', name: '24시온누리약국', address: '서울특별시 강남구 테헤란로 152', phone: '02-555-1234', lat: 37.5005, lng: 127.0367, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-2', name: '휴일지킴이약국', address: '서울특별시 종로구 종로 33', phone: '02-723-4567', lat: 37.5704, lng: 126.9922, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-3', name: '명동온누리약국', address: '서울특별시 중구 명동길 14', phone: '02-776-8901', lat: 37.5636, lng: 126.9869, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-4', name: '강서휴일약국', address: '서울특별시 강서구 공항대로 168', phone: '02-2659-2345', lat: 37.5580, lng: 126.8358, holidayOpen: '10:00', holidayClose: '16:00' },
    { id: 'hp-5', name: '노원24시약국', address: '서울특별시 노원구 동일로 1414', phone: '02-932-6789', lat: 37.6555, lng: 127.0620, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-6', name: '송파휴일약국', address: '서울특별시 송파구 올림픽로 300', phone: '02-421-3456', lat: 37.5107, lng: 127.0827, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-7', name: '마포온누리약국', address: '서울특별시 마포구 월드컵북로 21', phone: '02-332-7890', lat: 37.5571, lng: 126.9069, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-8', name: '영등포휴일약국', address: '서울특별시 영등포구 당산로 123', phone: '02-2636-1234', lat: 37.5347, lng: 126.8963, holidayOpen: '09:00', holidayClose: '15:00' },
    
    // 경기
    { id: 'hp-9', name: '수원역온누리약국', address: '경기도 수원시 팔달구 덕영대로 924', phone: '031-246-5678', lat: 37.2664, lng: 127.0016, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-10', name: '분당휴일약국', address: '경기도 성남시 분당구 불정로 6', phone: '031-712-9012', lat: 37.3509, lng: 127.1085, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-11', name: '일산24시약국', address: '경기도 고양시 일산동구 중앙로 1036', phone: '031-901-3456', lat: 37.6512, lng: 126.7739, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-12', name: '용인휴일약국', address: '경기도 용인시 수지구 성복로 64', phone: '031-262-7890', lat: 37.3219, lng: 127.0886, holidayOpen: '09:00', holidayClose: '16:00' },
    { id: 'hp-13', name: '안양온누리약국', address: '경기도 안양시 동안구 시민대로 235', phone: '031-383-2345', lat: 37.3898, lng: 126.9508, holidayOpen: '10:00', holidayClose: '18:00' },
    { id: 'hp-14', name: '부천휴일약국', address: '경기도 부천시 원미구 길주로 210', phone: '032-667-6789', lat: 37.4899, lng: 126.7831, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-15', name: '화성동탄약국', address: '경기도 화성시 동탄대로 446', phone: '031-372-1234', lat: 37.2066, lng: 127.0634, holidayOpen: '10:00', holidayClose: '16:00' },
    
    // 인천
    { id: 'hp-16', name: '인천터미널약국', address: '인천광역시 남동구 예술로 202', phone: '032-431-5678', lat: 37.4487, lng: 126.7020, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-17', name: '부평역약국', address: '인천광역시 부평구 부평대로 35', phone: '032-523-9012', lat: 37.4899, lng: 126.7234, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-18', name: '송도휴일약국', address: '인천광역시 연수구 송도과학로 32', phone: '032-851-3456', lat: 37.3845, lng: 126.6557, holidayOpen: '09:00', holidayClose: '15:00' },
    
    // 부산
    { id: 'hp-19', name: '서면24시약국', address: '부산광역시 부산진구 서면문화로 27', phone: '051-803-7890', lat: 35.1579, lng: 129.0588, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-20', name: '해운대휴일약국', address: '부산광역시 해운대구 해운대로 587', phone: '051-746-2345', lat: 35.1631, lng: 129.1638, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-21', name: '동래온누리약국', address: '부산광역시 동래구 명륜로 183', phone: '051-556-6789', lat: 35.2047, lng: 129.0786, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-22', name: '남포동약국', address: '부산광역시 중구 광복로 62', phone: '051-245-1234', lat: 35.0987, lng: 129.0324, holidayOpen: '09:00', holidayClose: '16:00' },
    
    // 대구
    { id: 'hp-23', name: '동성로휴일약국', address: '대구광역시 중구 동성로2길 81', phone: '053-252-5678', lat: 35.8681, lng: 128.5961, holidayOpen: '10:00', holidayClose: '18:00' },
    { id: 'hp-24', name: '수성24시약국', address: '대구광역시 수성구 동대구로 364', phone: '053-762-9012', lat: 35.8563, lng: 128.6294, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-25', name: '달서온누리약국', address: '대구광역시 달서구 월성로 233', phone: '053-631-3456', lat: 35.8282, lng: 128.5330, holidayOpen: '09:00', holidayClose: '17:00' },
    
    // 대전
    { id: 'hp-26', name: '둔산휴일약국', address: '대전광역시 서구 둔산로 117', phone: '042-472-7890', lat: 36.3512, lng: 127.3785, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-27', name: '유성24시약국', address: '대전광역시 유성구 대학로 76', phone: '042-823-2345', lat: 36.3623, lng: 127.3562, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-28', name: '대전역온누리약국', address: '대전광역시 동구 동서대로 1689', phone: '042-253-6789', lat: 36.3324, lng: 127.4346, holidayOpen: '10:00', holidayClose: '17:00' },
    
    // 광주
    { id: 'hp-29', name: '상무휴일약국', address: '광주광역시 서구 상무중앙로 76', phone: '062-375-1234', lat: 35.1469, lng: 126.8512, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-30', name: '충장로약국', address: '광주광역시 동구 충장로 64', phone: '062-223-5678', lat: 35.1486, lng: 126.9187, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-31', name: '광주역24시약국', address: '광주광역시 북구 무등로 235', phone: '062-513-9012', lat: 35.1595, lng: 126.9141, holidayOpen: '00:00', holidayClose: '24:00' },
    
    // 울산
    { id: 'hp-32', name: '울산휴일약국', address: '울산광역시 남구 삼산로 258', phone: '052-267-3456', lat: 35.5384, lng: 129.3114, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-33', name: '신복온누리약국', address: '울산광역시 울주군 범서읍 점촌3길 26', phone: '052-229-7890', lat: 35.5621, lng: 129.2654, holidayOpen: '10:00', holidayClose: '16:00' },
    
    // 세종
    { id: 'hp-34', name: '세종휴일약국', address: '세종특별자치시 한누리대로 2180', phone: '044-862-2345', lat: 36.4800, lng: 127.2890, holidayOpen: '09:00', holidayClose: '17:00' },
    
    // 강원
    { id: 'hp-35', name: '춘천역약국', address: '강원도 춘천시 중앙로 2', phone: '033-253-6789', lat: 37.8813, lng: 127.7298, holidayOpen: '10:00', holidayClose: '18:00' },
    { id: 'hp-36', name: '원주휴일약국', address: '강원도 원주시 중앙로 85', phone: '033-748-1234', lat: 37.3422, lng: 127.9202, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-37', name: '강릉24시약국', address: '강원도 강릉시 경강로 2046', phone: '033-644-5678', lat: 37.7519, lng: 128.8760, holidayOpen: '00:00', holidayClose: '24:00' },
    
    // 충북
    { id: 'hp-38', name: '청주휴일약국', address: '충청북도 청주시 상당구 상당로 314', phone: '043-254-9012', lat: 36.6424, lng: 127.4890, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-39', name: '충주온누리약국', address: '충청북도 충주시 성서동 1411', phone: '043-845-3456', lat: 36.9910, lng: 127.9259, holidayOpen: '10:00', holidayClose: '16:00' },
    
    // 충남
    { id: 'hp-40', name: '천안역약국', address: '충청남도 천안시 동남구 대흥로 201', phone: '041-563-7890', lat: 36.8151, lng: 127.1139, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-41', name: '아산휴일약국', address: '충청남도 아산시 배방읍 희망로 100', phone: '041-532-2345', lat: 36.7898, lng: 127.0047, holidayOpen: '10:00', holidayClose: '17:00' },
    
    // 전북
    { id: 'hp-42', name: '전주휴일약국', address: '전라북도 전주시 완산구 전주객사3길 22', phone: '063-284-6789', lat: 35.8242, lng: 127.1480, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-43', name: '익산24시약국', address: '전라북도 익산시 익산대로 252', phone: '063-835-1234', lat: 35.9483, lng: 126.9576, holidayOpen: '00:00', holidayClose: '24:00' },
    
    // 전남
    { id: 'hp-44', name: '목포휴일약국', address: '전라남도 목포시 하당로 123', phone: '061-285-5678', lat: 34.8118, lng: 126.3922, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-45', name: '순천온누리약국', address: '전라남도 순천시 장천로 96', phone: '061-752-9012', lat: 34.9506, lng: 127.4872, holidayOpen: '10:00', holidayClose: '18:00' },
    { id: 'hp-46', name: '여수휴일약국', address: '전라남도 여수시 시청로 1', phone: '061-653-3456', lat: 34.7604, lng: 127.6622, holidayOpen: '09:00', holidayClose: '16:00' },
    
    // 경북
    { id: 'hp-47', name: '포항휴일약국', address: '경상북도 포항시 남구 대이로 45', phone: '054-275-7890', lat: 36.0190, lng: 129.3435, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-48', name: '경주24시약국', address: '경상북도 경주시 원화로 285', phone: '054-773-2345', lat: 35.8562, lng: 129.2247, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-49', name: '구미온누리약국', address: '경상북도 구미시 송정대로 120', phone: '054-452-6789', lat: 36.1195, lng: 128.3446, holidayOpen: '10:00', holidayClose: '17:00' },
    
    // 경남
    { id: 'hp-50', name: '창원휴일약국', address: '경상남도 창원시 성산구 상남로 55', phone: '055-285-1234', lat: 35.2275, lng: 128.6819, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-51', name: '김해24시약국', address: '경상남도 김해시 호계로 395', phone: '055-322-5678', lat: 35.2341, lng: 128.8890, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-52', name: '진주온누리약국', address: '경상남도 진주시 진주대로 887', phone: '055-753-9012', lat: 35.1801, lng: 128.1076, holidayOpen: '10:00', holidayClose: '17:00' },
    
    // 제주
    { id: 'hp-53', name: '제주시휴일약국', address: '제주특별자치도 제주시 중앙로 217', phone: '064-752-3456', lat: 33.4996, lng: 126.5312, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-54', name: '서귀포24시약국', address: '제주특별자치도 서귀포시 중앙로 67', phone: '064-732-7890', lat: 33.2541, lng: 126.5603, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-55', name: '공항로약국', address: '제주특별자치도 제주시 공항로 2', phone: '064-742-2345', lat: 33.5067, lng: 126.4928, holidayOpen: '08:00', holidayClose: '22:00' },
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
    const Q0 = url.searchParams.get('Q0') || ''; // 시도
    const Q1 = url.searchParams.get('Q1') || ''; // 시군구
    const pageNo = url.searchParams.get('pageNo') || '1';
    const numOfRows = url.searchParams.get('numOfRows') || '100';
    const useMock = url.searchParams.get('useMock') === 'true';

    console.log(`Fetching holiday pharmacies: Q0=${Q0}, Q1=${Q1}, pageNo=${pageNo}, numOfRows=${numOfRows}`);

    // If no API key or useMock is true, return mock data
    if (!serviceKey || useMock) {
      console.log('Using mock holiday pharmacy data');
      const mockData = getMockHolidayPharmacies();
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

    // Try to fetch from API - QT=8 is for 공휴일 (holidays)
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);

    let apiUrl = `${API_URL}?serviceKey=${encodedKey}&QT=8&pageNo=${pageNo}&numOfRows=${numOfRows}`;
    
    if (Q0) {
      apiUrl += `&Q0=${encodeURIComponent(Q0)}`;
    }
    if (Q1) {
      apiUrl += `&Q1=${encodeURIComponent(Q1)}`;
    }

    console.log('API URL:', apiUrl.replace(encodedKey, 'HIDDEN'));

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/xml',
      },
    });

    if (!response.ok) {
      console.error('API request failed:', response.status);
      const mockData = getMockHolidayPharmacies();
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
    console.log('Response preview:', xmlText.substring(0, 500));

    // Check for API error
    if (xmlText.includes('<errMsg>')) {
      const errMsg = getValue(xmlText, 'errMsg');
      console.error('API Error:', errMsg);
      const mockData = getMockHolidayPharmacies();
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

    // Parse pharmacy items
    const pharmacies: HolidayPharmacy[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const item = match[1];
      
      // Parse coordinates
      const lat = getFloatValue(item, 'wgs84Lat');
      const lng = getFloatValue(item, 'wgs84Lon');
      
      // Skip if no valid coordinates
      if (!lat || !lng || lat < 33 || lat > 39 || lng < 124 || lng > 132) {
        continue;
      }

      const pharmacy: HolidayPharmacy = {
        id: getValue(item, 'hpid') || `hp-api-${pharmacies.length}`,
        name: getValue(item, 'dutyName') || '알 수 없음',
        address: getValue(item, 'dutyAddr') || '',
        phone: getValue(item, 'dutyTel1') || '',
        lat,
        lng,
        mondayOpen: getValue(item, 'dutyTime1s'),
        mondayClose: getValue(item, 'dutyTime1c'),
        holidayOpen: getValue(item, 'dutyTime8s'),
        holidayClose: getValue(item, 'dutyTime8c'),
      };

      pharmacies.push(pharmacy);
    }

    console.log(`Parsed ${pharmacies.length} holiday pharmacies from API`);

    // If no pharmacies found from API, use mock data
    if (pharmacies.length === 0) {
      console.log('No pharmacies from API, using mock data');
      const mockData = getMockHolidayPharmacies();
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
    const totalCount = parseInt(getValue(xmlText, 'totalCount')) || pharmacies.length;

    return new Response(
      JSON.stringify({
        success: true,
        data: pharmacies,
        totalCount,
        pageNo: parseInt(pageNo),
        numOfRows: parseInt(numOfRows),
        source: 'api',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error fetching holiday pharmacies:', error);
    const mockData = getMockHolidayPharmacies();
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
