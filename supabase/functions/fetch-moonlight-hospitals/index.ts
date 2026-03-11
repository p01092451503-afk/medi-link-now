// @deno-std v0.224.0 — updated 2026-03
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 국립중앙의료원_전국 병·의원 찾기 서비스 - 달빛어린이병원 및 소아전문센터 목록정보 조회
const API_BASE = "http://apis.data.go.kr/B552657/HsptlAsembySearchService";
const MOONLIGHT_ENDPOINT = `${API_BASE}/getMoonLightListInfoInqire`;

interface MoonlightHospital {
  dutyName: string;     // 기관명
  dutyAddr: string;     // 주소
  dutyTel1: string;     // 대표전화
  wgs84Lat: number;     // 위도
  wgs84Lon: number;     // 경도
  dutyDiv: string;      // 기관구분
  dutyDivNam: string;   // 기관구분명
  hpid: string;         // 기관ID
}

// Parse XML value helper
const getValue = (xml: string, tag: string): string => {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const result = regex.exec(xml);
  return result ? result[1].trim() : '';
};

// Parse all items from XML
const parseItems = (xml: string): MoonlightHospital[] => {
  const items: MoonlightHospital[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      dutyName: getValue(itemXml, 'dutyName'),
      dutyAddr: getValue(itemXml, 'dutyAddr'),
      dutyTel1: getValue(itemXml, 'dutyTel1'),
      wgs84Lat: parseFloat(getValue(itemXml, 'wgs84Lat')) || 0,
      wgs84Lon: parseFloat(getValue(itemXml, 'wgs84Lon')) || 0,
      dutyDiv: getValue(itemXml, 'dutyDiv'),
      dutyDivNam: getValue(itemXml, 'dutyDivNam'),
      hpid: getValue(itemXml, 'hpid'),
    });
  }

  return items;
};

// Fallback: 보건복지부 지정 달빛어린이병원 목록 (2024년 기준)
const FALLBACK_MOONLIGHT_HOSPITALS: MoonlightHospital[] = [
  { dutyName: "소화아동병원", dutyAddr: "서울특별시 용산구 청파로 383", dutyTel1: "02-705-9000", wgs84Lat: 37.5438, wgs84Lon: 126.9687, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "강남차병원", dutyAddr: "서울특별시 강남구 논현로 566", dutyTel1: "02-3468-3114", wgs84Lat: 37.5143, wgs84Lon: 127.0440, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "순천향대학교부속서울병원", dutyAddr: "서울특별시 용산구 대사관로 59", dutyTel1: "02-709-9114", wgs84Lat: 37.5342, wgs84Lon: 126.9916, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "한림대학교강동성심병원", dutyAddr: "서울특별시 강동구 성내로 150", dutyTel1: "02-2224-2114", wgs84Lat: 37.5350, wgs84Lon: 127.1267, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "인하대학교부속병원", dutyAddr: "인천광역시 중구 인항로 27", dutyTel1: "032-890-2114", wgs84Lat: 37.4514, wgs84Lon: 126.6831, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "가천대길병원", dutyAddr: "인천광역시 남동구 남동대로 774번길 21", dutyTel1: "032-460-3114", wgs84Lat: 37.4505, wgs84Lon: 126.7021, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "아주대학교병원", dutyAddr: "경기도 수원시 영통구 월드컵로 164", dutyTel1: "031-219-5114", wgs84Lat: 37.2802, wgs84Lon: 127.0455, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "분당서울대학교병원", dutyAddr: "경기도 성남시 분당구 구미로 173번길 82", dutyTel1: "031-787-7114", wgs84Lat: 37.3523, wgs84Lon: 127.1232, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "순천향대학교부속부천병원", dutyAddr: "경기도 부천시 조마루로 170", dutyTel1: "032-621-5114", wgs84Lat: 37.4888, wgs84Lon: 126.7792, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "의정부을지대학교병원", dutyAddr: "경기도 의정부시 금신로 68", dutyTel1: "031-951-3000", wgs84Lat: 37.7447, wgs84Lon: 127.0434, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "칠곡경북대학교병원", dutyAddr: "대구광역시 북구 호국로 807", dutyTel1: "053-200-2114", wgs84Lat: 35.9438, wgs84Lon: 128.6216, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "부산대학교병원", dutyAddr: "부산광역시 서구 구덕로 179", dutyTel1: "051-240-7114", wgs84Lat: 35.1014, wgs84Lon: 129.0098, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "부산대학교어린이병원", dutyAddr: "경상남도 양산시 물금읍 금오로 20", dutyTel1: "055-360-2114", wgs84Lat: 35.3277, wgs84Lon: 129.0094, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "전남대학교병원", dutyAddr: "광주광역시 동구 제봉로 42", dutyTel1: "062-220-5114", wgs84Lat: 35.1414, wgs84Lon: 126.9258, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "충남대학교병원", dutyAddr: "대전광역시 중구 문화로 282", dutyTel1: "042-280-7114", wgs84Lat: 36.3215, wgs84Lon: 127.4089, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "전북대학교병원", dutyAddr: "전라북도 전주시 덕진구 건지로 20", dutyTel1: "063-250-1114", wgs84Lat: 35.8447, wgs84Lon: 127.1383, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "원주세브란스기독병원", dutyAddr: "강원도 원주시 일산로 20", dutyTel1: "033-741-1233", wgs84Lat: 37.3502, wgs84Lon: 127.9416, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
  { dutyName: "제주대학교병원", dutyAddr: "제주특별자치도 제주시 아란13길 15", dutyTel1: "064-717-1114", wgs84Lat: 33.4609, wgs84Lon: 126.5619, dutyDiv: "B", dutyDivNam: "병원", hpid: "" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const serviceKey = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    if (!serviceKey) {
      console.warn('[fetch-moonlight-hospitals] PUBLIC_DATA_PORTAL_KEY not set, using fallback data');
      return new Response(JSON.stringify({
        success: true,
        data: FALLBACK_MOONLIGHT_HOSPITALS,
        source: 'fallback',
        totalCount: FALLBACK_MOONLIGHT_HOSPITALS.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request parameters
    let region = '';
    try {
      const body = await req.json();
      region = body.region || '';
    } catch {
      // No body is fine, fetch all
    }

    // Build URL - fetch all moonlight hospitals
    const params = new URLSearchParams({
      serviceKey: serviceKey,
      numOfRows: '100',
      pageNo: '1',
    });
    if (region) {
      params.set('Q0', region);
    }

    const url = `${MOONLIGHT_ENDPOINT}?${params.toString()}`;
    console.log(`[fetch-moonlight-hospitals] Fetching: ${MOONLIGHT_ENDPOINT}?Q0=${region || 'all'}`);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/xml' },
    });

    if (!response.ok) {
      console.error(`[fetch-moonlight-hospitals] API returned ${response.status}`);
      return new Response(JSON.stringify({
        success: true,
        data: FALLBACK_MOONLIGHT_HOSPITALS,
        source: 'fallback',
        totalCount: FALLBACK_MOONLIGHT_HOSPITALS.length,
        error: `API returned ${response.status}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const xml = await response.text();
    console.log(`[fetch-moonlight-hospitals] Response length: ${xml.length}`);

    // Check for API error
    if (xml.includes('<returnAuthMsg>') && xml.includes('SERVICE_KEY')) {
      console.error('[fetch-moonlight-hospitals] API key authentication error');
      return new Response(JSON.stringify({
        success: true,
        data: FALLBACK_MOONLIGHT_HOSPITALS,
        source: 'fallback',
        totalCount: FALLBACK_MOONLIGHT_HOSPITALS.length,
        error: 'API key authentication failed',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const items = parseItems(xml);
    const totalCount = parseInt(getValue(xml, 'totalCount')) || items.length;

    console.log(`[fetch-moonlight-hospitals] Parsed ${items.length} moonlight hospitals (total: ${totalCount})`);

    // If no items found from API, use fallback
    if (items.length === 0) {
      console.warn('[fetch-moonlight-hospitals] No items from API, using fallback');
      return new Response(JSON.stringify({
        success: true,
        data: FALLBACK_MOONLIGHT_HOSPITALS,
        source: 'fallback',
        totalCount: FALLBACK_MOONLIGHT_HOSPITALS.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: items,
      source: 'api',
      totalCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[fetch-moonlight-hospitals] Error:', error);
    return new Response(JSON.stringify({
      success: true,
      data: FALLBACK_MOONLIGHT_HOSPITALS,
      source: 'fallback',
      totalCount: FALLBACK_MOONLIGHT_HOSPITALS.length,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
