import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 건강보험심사평가원 약국정보서비스 API (B551182)
const API_URL = "http://apis.data.go.kr/B551182/pharmacyInfoService/getParmacyBasisList";

interface PharmacyRow {
  id: number;
  hpid: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  lat: number;
  lng: number;
  duty_time_1s: string | null;
  duty_time_1c: string | null;
  duty_time_2s: string | null;
  duty_time_2c: string | null;
  duty_time_3s: string | null;
  duty_time_3c: string | null;
  duty_time_4s: string | null;
  duty_time_4c: string | null;
  duty_time_5s: string | null;
  duty_time_5c: string | null;
  duty_time_6s: string | null;
  duty_time_6c: string | null;
  duty_time_7s: string | null;
  duty_time_7c: string | null;
  duty_time_8s: string | null;
  duty_time_8c: string | null;
  is_night_pharmacy: boolean;
  is_24h: boolean;
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

// Convert DB row to API response format
const dbRowToPharmacy = (row: PharmacyRow) => ({
  id: row.hpid || `pharmacy-${row.id}`,
  name: row.name,
  address: row.address || '',
  phone: row.phone || '',
  lat: row.lat,
  lng: row.lng,
  dutyTime1s: row.duty_time_1s || '',
  dutyTime1c: row.duty_time_1c || '',
  dutyTime2s: row.duty_time_2s || '',
  dutyTime2c: row.duty_time_2c || '',
  dutyTime3s: row.duty_time_3s || '',
  dutyTime3c: row.duty_time_3c || '',
  dutyTime4s: row.duty_time_4s || '',
  dutyTime4c: row.duty_time_4c || '',
  dutyTime5s: row.duty_time_5s || '',
  dutyTime5c: row.duty_time_5c || '',
  dutyTime6s: row.duty_time_6s || '',
  dutyTime6c: row.duty_time_6c || '',
  dutyTime7s: row.duty_time_7s || '',
  dutyTime7c: row.duty_time_7c || '',
  dutyTime8s: row.duty_time_8s || '',
  dutyTime8c: row.duty_time_8c || '',
  isNightPharmacy: row.is_night_pharmacy,
  is24h: row.is_24h,
});

// Parse pharmacy from HIRA API XML item
const parsePharmacyFromXml = (item: string) => {
  // HIRA API: XPos = 경도(lng), YPos = 위도(lat)
  const lng = getFloatValue(item, 'XPos');
  const lat = getFloatValue(item, 'YPos');
  if (!lat || !lng) return null;

  const name = getValue(item, 'yadmNm');
  if (!name) return null;

  return {
    id: getValue(item, 'ykiho') || `pharmacy-${lat}-${lng}`,
    name,
    address: getValue(item, 'addr'),
    phone: getValue(item, 'telno'),
    lat,
    lng,
    // HIRA 기본 목록 API에는 영업시간 정보 없음
    dutyTime1s: '', dutyTime1c: '',
    dutyTime2s: '', dutyTime2c: '',
    dutyTime3s: '', dutyTime3c: '',
    dutyTime4s: '', dutyTime4c: '',
    dutyTime5s: '', dutyTime5c: '',
    dutyTime6s: '', dutyTime6c: '',
    dutyTime7s: '', dutyTime7c: '',
    dutyTime8s: '', dutyTime8c: '',
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const radiusKm = parseFloat(url.searchParams.get('radius') || '5');
    const nightOnly = url.searchParams.get('nightOnly') === 'true';

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing lat or lng parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);

    // === 1단계: DB에서 먼저 조회 ===
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 대략적인 좌표 범위 계산 (1도 ≈ 111km)
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));

    let query = supabase
      .from('pharmacies')
      .select('*')
      .gte('lat', centerLat - latDelta)
      .lte('lat', centerLat + latDelta)
      .gte('lng', centerLng - lngDelta)
      .lte('lng', centerLng + lngDelta);

    if (nightOnly) {
      query = query.eq('is_night_pharmacy', true);
    }

    const { data: dbPharmacies, error: dbError } = await query.limit(200);

    if (!dbError && dbPharmacies && dbPharmacies.length > 0) {
      console.log(`[fetch-nearby-pharmacies] DB hit: ${dbPharmacies.length} pharmacies found`);
      const pharmacies = dbPharmacies.map(dbRowToPharmacy);
      return new Response(
        JSON.stringify({
          success: true,
          data: pharmacies,
          count: pharmacies.length,
          source: 'db',
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[fetch-nearby-pharmacies] DB miss (${dbPharmacies?.length || 0} results), trying API...`);

    // === 2단계: DB에 데이터 없으면 API 호출 ===
    const serviceKey = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    if (!serviceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured', data: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // HIRA API: xPos=경도, yPos=위도, radius=검색반경(m)
    const radiusM = Math.round(radiusKm * 1000);
    const apiUrl = `${API_URL}?ServiceKey=${serviceKey}&xPos=${lng}&yPos=${lat}&radius=${radiusM}&pageNo=1&numOfRows=200`;
    console.log(`[fetch-nearby-pharmacies] Fetching HIRA API: xPos=${lng}&yPos=${lat}&radius=${radiusM}`);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(`[fetch-nearby-pharmacies] API returned ${response.status}`);
      return new Response(
        JSON.stringify({ success: false, error: `API error: ${response.status}`, data: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const xmlText = await response.text();

    // 에러 응답 체크
    if (xmlText.includes('<errMsg>') || xmlText.includes('<cmmMsgHeader>')) {
      const errMsg = getValue(xmlText, 'errMsg') || getValue(xmlText, 'returnAuthMsg');
      console.error(`[fetch-nearby-pharmacies] API error message: ${errMsg}`);
      return new Response(
        JSON.stringify({ success: false, error: `API error: ${errMsg}`, data: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const pharmacies: ReturnType<typeof parsePharmacyFromXml>[] = [];
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const pharmacy = parsePharmacyFromXml(match[1]);
      if (pharmacy) pharmacies.push(pharmacy);
    }

    console.log(`[fetch-nearby-pharmacies] API returned ${pharmacies.length} pharmacies`);

    return new Response(
      JSON.stringify({
        success: true,
        data: pharmacies,
        count: pharmacies.length,
        source: 'api',
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[fetch-nearby-pharmacies] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message, data: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
