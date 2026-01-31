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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const radius = url.searchParams.get('radius') || '5000'; // Default 5km in meters
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

    const serviceKey = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    if (!serviceKey) {
      console.error('PUBLIC_DATA_PORTAL_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API key not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build API URL with parameters
    const apiUrl = new URL(API_URL);
    apiUrl.searchParams.set('serviceKey', serviceKey);
    apiUrl.searchParams.set('WGS84_LAT', lat);
    apiUrl.searchParams.set('WGS84_LON', lng);
    apiUrl.searchParams.set('pageNo', '1');
    apiUrl.searchParams.set('numOfRows', numOfRows);

    console.log(`Fetching pharmacies near ${lat}, ${lng}`);
    
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      console.error(`API request failed: ${response.status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `API request failed: ${response.status}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const xmlText = await response.text();
    
    // Check for API error
    if (xmlText.includes('<errMsg>')) {
      const errMsg = getValue(xmlText, 'errMsg');
      console.error('API error:', errMsg);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errMsg 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const pharmacies: NearbyPharmacy[] = [];
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const pharmacy = parsePharmacyFromXml(match[1]);
      if (pharmacy) {
        pharmacies.push(pharmacy);
      }
    }

    console.log(`Found ${pharmacies.length} pharmacies`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: pharmacies,
        count: pharmacies.length,
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
