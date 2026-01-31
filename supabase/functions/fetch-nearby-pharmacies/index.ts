import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 국립중앙의료원 전국 약국 정보 조회 서비스 API
const API_URL = "http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire";

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

// Parse pharmacy data from API response
const parsePharmacyFromXml = (item: string): NearbyPharmacy | null => {
  const lat = getFloatValue(item, 'wgs84Lat');
  const lng = getFloatValue(item, 'wgs84Lon');
  
  if (!lat || !lng) return null;
  
  const hpid = getValue(item, 'hpid');
  const name = getValue(item, 'dutyName');
  
  if (!name) return null;
  
  return {
    id: hpid || `pharmacy-${lat}-${lng}`,
    name,
    address: getValue(item, 'dutyAddr'),
    phone: getValue(item, 'dutyTel1'),
    lat,
    lng,
    dutyTime1s: getValue(item, 'dutyTime1s'),
    dutyTime1c: getValue(item, 'dutyTime1c'),
    dutyTime2s: getValue(item, 'dutyTime2s'),
    dutyTime2c: getValue(item, 'dutyTime2c'),
    dutyTime3s: getValue(item, 'dutyTime3s'),
    dutyTime3c: getValue(item, 'dutyTime3c'),
    dutyTime4s: getValue(item, 'dutyTime4s'),
    dutyTime4c: getValue(item, 'dutyTime4c'),
    dutyTime5s: getValue(item, 'dutyTime5s'),
    dutyTime5c: getValue(item, 'dutyTime5c'),
    dutyTime6s: getValue(item, 'dutyTime6s'),
    dutyTime6c: getValue(item, 'dutyTime6c'),
    dutyTime7s: getValue(item, 'dutyTime7s'),
    dutyTime7c: getValue(item, 'dutyTime7c'),
    dutyTime8s: getValue(item, 'dutyTime8s'),
    dutyTime8c: getValue(item, 'dutyTime8c'),
  };
};

// Mock pharmacies with realistic operating hours
const getMockPharmacies = (centerLat: number, centerLng: number): NearbyPharmacy[] => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Base pharmacies near major cities
  const basePharmacies: NearbyPharmacy[] = [
    // 서울 지역
    { id: 'np-1', name: '24시온누리약국', address: '서울특별시 강남구 테헤란로 152', phone: '02-555-1234', lat: 37.5005, lng: 127.0367, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400', dutyTime8s: '0000', dutyTime8c: '2400' },
    { id: 'np-2', name: '강남역대림약국', address: '서울특별시 강남구 강남대로 396', phone: '02-567-8901', lat: 37.4979, lng: 127.0276, dutyTime1s: '0900', dutyTime1c: '2200', dutyTime2s: '0900', dutyTime2c: '2200', dutyTime3s: '0900', dutyTime3c: '2200', dutyTime4s: '0900', dutyTime4c: '2200', dutyTime5s: '0900', dutyTime5c: '2200', dutyTime6s: '0900', dutyTime6c: '1800', dutyTime7s: '1000', dutyTime7c: '1700' },
    { id: 'np-3', name: '서울역24시약국', address: '서울특별시 중구 한강대로 405', phone: '02-318-5678', lat: 37.5547, lng: 126.9707, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400', dutyTime8s: '0000', dutyTime8c: '2400' },
    { id: 'np-4', name: '명동온누리약국', address: '서울특별시 중구 명동길 14', phone: '02-776-8901', lat: 37.5636, lng: 126.9869, dutyTime1s: '0830', dutyTime1c: '2100', dutyTime2s: '0830', dutyTime2c: '2100', dutyTime3s: '0830', dutyTime3c: '2100', dutyTime4s: '0830', dutyTime4c: '2100', dutyTime5s: '0830', dutyTime5c: '2100', dutyTime6s: '0900', dutyTime6c: '1800' },
    { id: 'np-5', name: '종로휴일약국', address: '서울특별시 종로구 종로 33', phone: '02-723-4567', lat: 37.5704, lng: 126.9922, dutyTime1s: '0900', dutyTime1c: '2000', dutyTime2s: '0900', dutyTime2c: '2000', dutyTime3s: '0900', dutyTime3c: '2000', dutyTime4s: '0900', dutyTime4c: '2000', dutyTime5s: '0900', dutyTime5c: '2000', dutyTime6s: '0900', dutyTime6c: '1700', dutyTime7s: '1000', dutyTime7c: '1600', dutyTime8s: '1000', dutyTime8c: '1600' },
    { id: 'np-6', name: '홍대입구24시약국', address: '서울특별시 마포구 양화로 188', phone: '02-335-2345', lat: 37.5563, lng: 126.9237, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
    { id: 'np-7', name: '신촌연세약국', address: '서울특별시 서대문구 신촌로 112', phone: '02-324-6789', lat: 37.5596, lng: 126.9426, dutyTime1s: '0900', dutyTime1c: '2130', dutyTime2s: '0900', dutyTime2c: '2130', dutyTime3s: '0900', dutyTime3c: '2130', dutyTime4s: '0900', dutyTime4c: '2130', dutyTime5s: '0900', dutyTime5c: '2130', dutyTime6s: '0900', dutyTime6c: '1800' },
    { id: 'np-8', name: '영등포약국', address: '서울특별시 영등포구 당산로 123', phone: '02-2636-1234', lat: 37.5347, lng: 126.8963, dutyTime1s: '0830', dutyTime1c: '2000', dutyTime2s: '0830', dutyTime2c: '2000', dutyTime3s: '0830', dutyTime3c: '2000', dutyTime4s: '0830', dutyTime4c: '2000', dutyTime5s: '0830', dutyTime5c: '2000', dutyTime6s: '0900', dutyTime6c: '1500' },
    { id: 'np-9', name: '잠실24시약국', address: '서울특별시 송파구 올림픽로 435', phone: '02-424-7890', lat: 37.5133, lng: 127.1001, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
    { id: 'np-10', name: '건대입구약국', address: '서울특별시 광진구 아차산로 333', phone: '02-444-5678', lat: 37.5404, lng: 127.0697, dutyTime1s: '0900', dutyTime1c: '2200', dutyTime2s: '0900', dutyTime2c: '2200', dutyTime3s: '0900', dutyTime3c: '2200', dutyTime4s: '0900', dutyTime4c: '2200', dutyTime5s: '0900', dutyTime5c: '2200', dutyTime6s: '0900', dutyTime6c: '1800', dutyTime7s: '1000', dutyTime7c: '1700' },
    
    // 경기 지역
    { id: 'np-11', name: '분당24시약국', address: '경기도 성남시 분당구 불정로 6', phone: '031-712-9012', lat: 37.3509, lng: 127.1085, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
    { id: 'np-12', name: '수원역약국', address: '경기도 수원시 팔달구 덕영대로 924', phone: '031-246-5678', lat: 37.2664, lng: 127.0016, dutyTime1s: '0830', dutyTime1c: '2100', dutyTime2s: '0830', dutyTime2c: '2100', dutyTime3s: '0830', dutyTime3c: '2100', dutyTime4s: '0830', dutyTime4c: '2100', dutyTime5s: '0830', dutyTime5c: '2100', dutyTime6s: '0900', dutyTime6c: '1800', dutyTime7s: '1000', dutyTime7c: '1700' },
    { id: 'np-13', name: '일산24시약국', address: '경기도 고양시 일산동구 중앙로 1036', phone: '031-901-3456', lat: 37.6512, lng: 126.7739, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
    { id: 'np-14', name: '용인수지약국', address: '경기도 용인시 수지구 성복로 64', phone: '031-262-7890', lat: 37.3219, lng: 127.0886, dutyTime1s: '0900', dutyTime1c: '2000', dutyTime2s: '0900', dutyTime2c: '2000', dutyTime3s: '0900', dutyTime3c: '2000', dutyTime4s: '0900', dutyTime4c: '2000', dutyTime5s: '0900', dutyTime5c: '2000', dutyTime6s: '0900', dutyTime6c: '1500' },
    { id: 'np-15', name: '안양약국', address: '경기도 안양시 동안구 시민대로 235', phone: '031-383-2345', lat: 37.3898, lng: 126.9508, dutyTime1s: '0900', dutyTime1c: '2100', dutyTime2s: '0900', dutyTime2c: '2100', dutyTime3s: '0900', dutyTime3c: '2100', dutyTime4s: '0900', dutyTime4c: '2100', dutyTime5s: '0900', dutyTime5c: '2100', dutyTime6s: '0900', dutyTime6c: '1800' },
    
    // 인천 지역
    { id: 'np-16', name: '인천부평24시약국', address: '인천광역시 부평구 부평대로 35', phone: '032-523-9012', lat: 37.4899, lng: 126.7234, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
    { id: 'np-17', name: '송도약국', address: '인천광역시 연수구 송도과학로 32', phone: '032-851-3456', lat: 37.3845, lng: 126.6557, dutyTime1s: '0900', dutyTime1c: '2100', dutyTime2s: '0900', dutyTime2c: '2100', dutyTime3s: '0900', dutyTime3c: '2100', dutyTime4s: '0900', dutyTime4c: '2100', dutyTime5s: '0900', dutyTime5c: '2100', dutyTime6s: '0900', dutyTime6c: '1800', dutyTime7s: '1000', dutyTime7c: '1700' },
    { id: 'np-18', name: '계양온누리약국', address: '인천광역시 계양구 계양대로 100', phone: '032-545-7890', lat: 37.5370, lng: 126.7377, dutyTime1s: '0830', dutyTime1c: '2000', dutyTime2s: '0830', dutyTime2c: '2000', dutyTime3s: '0830', dutyTime3c: '2000', dutyTime4s: '0830', dutyTime4c: '2000', dutyTime5s: '0830', dutyTime5c: '2000', dutyTime6s: '0900', dutyTime6c: '1500' },
    { id: 'np-19', name: '인천터미널약국', address: '인천광역시 남동구 예술로 202', phone: '032-431-5678', lat: 37.4487, lng: 126.7020, dutyTime1s: '0900', dutyTime1c: '2130', dutyTime2s: '0900', dutyTime2c: '2130', dutyTime3s: '0900', dutyTime3c: '2130', dutyTime4s: '0900', dutyTime4c: '2130', dutyTime5s: '0900', dutyTime5c: '2130', dutyTime6s: '0900', dutyTime6c: '1800' },
    { id: 'np-20', name: '연수24시약국', address: '인천광역시 연수구 경원대로 123', phone: '032-813-2345', lat: 37.4100, lng: 126.6780, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
    
    // 부산 지역
    { id: 'np-21', name: '부산역24시약국', address: '부산광역시 동구 중앙대로 206', phone: '051-441-5678', lat: 35.1141, lng: 129.0389, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
    { id: 'np-22', name: '서면약국', address: '부산광역시 부산진구 서면로 50', phone: '051-806-9012', lat: 35.1579, lng: 129.0588, dutyTime1s: '0900', dutyTime1c: '2200', dutyTime2s: '0900', dutyTime2c: '2200', dutyTime3s: '0900', dutyTime3c: '2200', dutyTime4s: '0900', dutyTime4c: '2200', dutyTime5s: '0900', dutyTime5c: '2200', dutyTime6s: '0900', dutyTime6c: '1800', dutyTime7s: '1000', dutyTime7c: '1700' },
    { id: 'np-23', name: '해운대24시약국', address: '부산광역시 해운대구 해운대로 123', phone: '051-731-3456', lat: 35.1629, lng: 129.1635, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
    
    // 대구 지역
    { id: 'np-24', name: '동대구역24시약국', address: '대구광역시 동구 동대구로 550', phone: '053-756-5678', lat: 35.8793, lng: 128.6286, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
    { id: 'np-25', name: '반월당약국', address: '대구광역시 중구 국채보상로 526', phone: '053-253-9012', lat: 35.8660, lng: 128.5918, dutyTime1s: '0900', dutyTime1c: '2100', dutyTime2s: '0900', dutyTime2c: '2100', dutyTime3s: '0900', dutyTime3c: '2100', dutyTime4s: '0900', dutyTime4c: '2100', dutyTime5s: '0900', dutyTime5c: '2100', dutyTime6s: '0900', dutyTime6c: '1800' },
    
    // 대전 지역
    { id: 'np-26', name: '대전역24시약국', address: '대전광역시 동구 중앙로 215', phone: '042-253-5678', lat: 36.3323, lng: 127.4346, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
    { id: 'np-27', name: '둔산약국', address: '대전광역시 서구 둔산대로 117', phone: '042-486-9012', lat: 36.3532, lng: 127.3783, dutyTime1s: '0900', dutyTime1c: '2100', dutyTime2s: '0900', dutyTime2c: '2100', dutyTime3s: '0900', dutyTime3c: '2100', dutyTime4s: '0900', dutyTime4c: '2100', dutyTime5s: '0900', dutyTime5c: '2100', dutyTime6s: '0900', dutyTime6c: '1800', dutyTime7s: '1000', dutyTime7c: '1700' },
    
    // 광주 지역
    { id: 'np-28', name: '광주송정역24시약국', address: '광주광역시 광산구 상무대로 205', phone: '062-942-5678', lat: 35.1377, lng: 126.7920, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
    { id: 'np-29', name: '충장로약국', address: '광주광역시 동구 충장로 40', phone: '062-224-9012', lat: 35.1467, lng: 126.9194, dutyTime1s: '0900', dutyTime1c: '2100', dutyTime2s: '0900', dutyTime2c: '2100', dutyTime3s: '0900', dutyTime3c: '2100', dutyTime4s: '0900', dutyTime4c: '2100', dutyTime5s: '0900', dutyTime5c: '2100', dutyTime6s: '0900', dutyTime6c: '1800' },
    
    // 제주 지역
    { id: 'np-30', name: '제주공항24시약국', address: '제주특별자치도 제주시 공항로 2', phone: '064-743-5678', lat: 33.5113, lng: 126.4929, dutyTime1s: '0000', dutyTime1c: '2400', dutyTime2s: '0000', dutyTime2c: '2400', dutyTime3s: '0000', dutyTime3c: '2400', dutyTime4s: '0000', dutyTime4c: '2400', dutyTime5s: '0000', dutyTime5c: '2400', dutyTime6s: '0000', dutyTime6c: '2400', dutyTime7s: '0000', dutyTime7c: '2400' },
  ];

  // Calculate distance and filter by proximity (within ~50km)
  const filteredPharmacies = basePharmacies.map(p => {
    const distance = Math.sqrt(Math.pow(p.lat - centerLat, 2) + Math.pow(p.lng - centerLng, 2));
    return { ...p, distance };
  }).filter(p => p.distance < 0.5) // ~50km
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 30);

  return filteredPharmacies;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const numOfRows = url.searchParams.get('numOfRows') || '100';

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing lat or lng parameters' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);

    const serviceKey = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    
    // Try API first if key exists
    if (serviceKey) {
      try {
        const apiUrl = new URL(API_URL);
        apiUrl.searchParams.set('serviceKey', serviceKey);
        apiUrl.searchParams.set('WGS84_LAT', lat);
        apiUrl.searchParams.set('WGS84_LON', lng);
        apiUrl.searchParams.set('pageNo', '1');
        apiUrl.searchParams.set('numOfRows', numOfRows);

        console.log(`Fetching pharmacies near ${lat}, ${lng}`);
        
        const response = await fetch(apiUrl.toString());
        
        if (response.ok) {
          const xmlText = await response.text();
          
          if (!xmlText.includes('<errMsg>')) {
            const itemRegex = /<item>([\s\S]*?)<\/item>/g;
            const pharmacies: NearbyPharmacy[] = [];
            let match;
            
            while ((match = itemRegex.exec(xmlText)) !== null) {
              const pharmacy = parsePharmacyFromXml(match[1]);
              if (pharmacy) {
                pharmacies.push(pharmacy);
              }
            }

            if (pharmacies.length > 0) {
              console.log(`Found ${pharmacies.length} pharmacies from API`);
              return new Response(
                JSON.stringify({ 
                  success: true, 
                  data: pharmacies,
                  count: pharmacies.length,
                  source: 'api',
                  timestamp: new Date().toISOString()
                }),
                { 
                  status: 200, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            }
          }
        }
        
        console.log('API failed, falling back to mock data');
      } catch (apiError) {
        console.error('API error, using mock data:', apiError);
      }
    }

    // Fallback to mock data
    const mockPharmacies = getMockPharmacies(centerLat, centerLng);
    console.log(`Returning ${mockPharmacies.length} mock pharmacies`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: mockPharmacies,
        count: mockPharmacies.length,
        source: 'mock',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
