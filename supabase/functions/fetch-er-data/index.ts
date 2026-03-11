// @deno-std v0.224.0 — updated 2026-03
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const allowedOrigins = [
  'https://find-bed-now.lovable.app',
  'https://id-preview--0014984b-817e-4711-bddc-15810d8fceb9.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

// API Endpoints from National Emergency Medical Center
const API_BASE = "http://apis.data.go.kr/B552657/ErmctInfoInqireService";
const API_ENDPOINTS = {
  beds: `${API_BASE}/getEmrrmRltmUsefulSckbdInfoInqire`,
  acceptance: `${API_BASE}/getSrsillDissAcceptncPosblInfoInqire`,
  messages: `${API_BASE}/getEmrrmSrsillDissMsgInqire`,
  trauma: `${API_BASE}/getStrmListInfoInqire`,
};

interface ERData {
  hospitalId: string;
  hospitalName: string;
  address: string;
  phone: string;
  generalBeds: number;
  pediatricBeds: number;
  feverBeds: number;
  icuBeds: number;
  surgicalIcuBeds: number;
  medicalIcuBeds: number;
  operatingRooms: number;
  neonatalIcuBeds: number;
  equipment: {
    ct: boolean;
    mri: boolean;
    angio: boolean;
    ventilator: boolean;
    ecmo: boolean;
    incubator: boolean;
  };
  erDivision: string;
  traumaYn: string;
  lat?: number;
  lng?: number;
  isTraumaCenter: boolean;
  acceptance?: {
    heart: boolean;
    brainBleed: boolean;
    brainStroke: boolean;
    endoscopy: boolean;
    dialysis: boolean;
  };
  alertMessage?: string;
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

const getBoolValue = (xml: string, tag: string): boolean => {
  const val = getValue(xml, tag).toUpperCase();
  return val === 'Y' || val === '1' || val === 'TRUE';
};

// ── Cache-first: check if DB has fresh data ──
async function getCachedAge(city: string): Promise<number | null> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await sb
      .from('hospital_status_with_age')
      .select('age_minutes, data_source')
      .eq('data_source', 'api')
      .order('last_updated', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      return data[0].age_minutes ?? null;
    }
  } catch (e) {
    console.error('[cache-check] Error:', e);
  }
  return null;
}

// Fetch acceptance data
async function fetchAcceptanceData(serviceKey: string, city: string): Promise<Map<string, ERData['acceptance']>> {
  const acceptanceMap = new Map<string, ERData['acceptance']>();
  try {
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);
    const url = `${API_ENDPOINTS.acceptance}?serviceKey=${encodedKey}&STAGE1=${encodeURIComponent(city)}&numOfRows=100&pageNo=1`;
    console.log("Fetching acceptance data...");
    const response = await fetch(url, { headers: { 'Accept': 'application/xml' } });
    if (!response.ok) { console.error("Acceptance API failed:", response.status); return acceptanceMap; }
    const xmlText = await response.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      const hpid = getValue(itemXml, 'hpid');
      if (hpid) {
        acceptanceMap.set(hpid, {
          heart: getBoolValue(itemXml, 'MKioskTy1'),
          brainBleed: getBoolValue(itemXml, 'MKioskTy2'),
          brainStroke: getBoolValue(itemXml, 'MKioskTy3'),
          endoscopy: getBoolValue(itemXml, 'MKioskTy4'),
          dialysis: getBoolValue(itemXml, 'MKioskTy5'),
        });
      }
    }
    console.log(`Fetched ${acceptanceMap.size} acceptance records`);
  } catch (error) { console.error("Error fetching acceptance data:", error); }
  return acceptanceMap;
}

// Fetch messages
async function fetchMessages(serviceKey: string, city: string): Promise<Map<string, string>> {
  const messagesMap = new Map<string, string>();
  try {
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);
    const url = `${API_ENDPOINTS.messages}?serviceKey=${encodedKey}&STAGE1=${encodeURIComponent(city)}&numOfRows=100&pageNo=1`;
    console.log("Fetching hospital messages...");
    const response = await fetch(url, { headers: { 'Accept': 'application/xml' } });
    if (!response.ok) { console.error("Messages API failed:", response.status); return messagesMap; }
    const xmlText = await response.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      const hpid = getValue(itemXml, 'hpid');
      const message = getValue(itemXml, 'symBlkMsg') || getValue(itemXml, 'msgType');
      if (hpid && message) messagesMap.set(hpid, message);
    }
    console.log(`Fetched ${messagesMap.size} hospital messages`);
  } catch (error) { console.error("Error fetching messages:", error); }
  return messagesMap;
}

// Fetch trauma centers
async function fetchTraumaCenters(serviceKey: string): Promise<Set<string>> {
  const traumaSet = new Set<string>();
  try {
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);
    const url = `${API_ENDPOINTS.trauma}?serviceKey=${encodedKey}&numOfRows=100&pageNo=1`;
    console.log("Fetching trauma center list...");
    const response = await fetch(url, { headers: { 'Accept': 'application/xml' } });
    if (!response.ok) { console.error("Trauma API failed:", response.status); return traumaSet; }
    const xmlText = await response.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const hpid = getValue(match[1], 'hpid');
      if (hpid) traumaSet.add(hpid);
    }
    console.log(`Found ${traumaSet.size} trauma centers`);
  } catch (error) { console.error("Error fetching trauma centers:", error); }
  return traumaSet;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SERVICE_KEY = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    if (!SERVICE_KEY) {
      return new Response(
        JSON.stringify({
          success: false, error: "API key not configured", useMockData: true,
          diagnostics: { reason: 'API_KEY_NOT_CONFIGURED', message: 'Supabase Secrets에 PUBLIC_DATA_PORTAL_KEY가 등록되지 않았습니다.', setupGuide: 'supabase/README.md 참고', timestamp: new Date().toISOString() }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { searchParams } = new URL(req.url);
    let bodyCity = searchParams.get('city') || '서울특별시';
    let bodyDistrict = searchParams.get('district') || '';
    let forceRefresh = false;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        bodyCity = body.city || bodyCity;
        bodyDistrict = body.district || bodyDistrict;
        forceRefresh = body.forceRefresh === true;
      } catch { /* use query params */ }
    }

    // ── Cache guard: skip API if data < 5 min old ──
    if (!forceRefresh) {
      const cacheAge = await getCachedAge(bodyCity);
      if (cacheAge !== null && cacheAge < 5) {
        console.log(`[fetch-er-data] Cache is fresh (${cacheAge.toFixed(1)}min). Skipping API call.`);
        return new Response(
          JSON.stringify({
            success: true, data: [], count: 0,
            city: bodyCity, district: bodyDistrict,
            cached: true, cacheAgeMinutes: cacheAge,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    const isAlreadyEncoded = SERVICE_KEY.includes('%');
    const encodedKey = isAlreadyEncoded ? SERVICE_KEY : encodeURIComponent(SERVICE_KEY);
    console.log(`Fetching ER data for: ${bodyCity} ${bodyDistrict}`);

    // Fetch beds with pagination
    async function fetchAllBeds(key: string, city: string, district: string): Promise<string[]> {
      const allItemXmls: string[] = [];
      let pageNo = 1;
      const pageSize = 100;
      while (true) {
        let url = `${API_ENDPOINTS.beds}?serviceKey=${key}&STAGE1=${encodeURIComponent(city)}&numOfRows=${pageSize}&pageNo=${pageNo}`;
        if (district) url += `&STAGE2=${encodeURIComponent(district)}`;
        console.log(`Fetching beds page ${pageNo}...`);
        const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/xml' } });
        if (!res.ok) {
          console.error(`Beds API page ${pageNo} returned status: ${res.status}`);
          break;
        }
        const xml = await res.text();
        if (pageNo === 1) console.log(`Beds XML page 1 (first 500 chars): ${xml.substring(0, 500)}`);
        const totalCount = parseInt(getValue(xml, 'totalCount')) || 0;
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let pageItems = 0;
        while ((match = itemRegex.exec(xml)) !== null) { allItemXmls.push(match[1]); pageItems++; }
        console.log(`Page ${pageNo}: ${pageItems} items (total so far: ${allItemXmls.length}/${totalCount})`);
        if (allItemXmls.length >= totalCount) break;
        if (pageItems < pageSize) break;
        pageNo++;
        if (pageNo > 10) break;
      }
      return allItemXmls;
    }

    // ── Only fetch beds (core) + acceptance. Skip messages/trauma to save quota ──
    const [bedItems, acceptanceData] = await Promise.all([
      fetchAllBeds(encodedKey, bodyCity, bodyDistrict),
      fetchAcceptanceData(SERVICE_KEY, bodyCity),
    ]);

    // Fetch messages only if we have quota headroom (beds returned data)
    let messagesData = new Map<string, string>();
    let traumaCenters = new Set<string>();
    if (bedItems.length > 0) {
      // Fetch messages — lightweight, valuable for users
      messagesData = await fetchMessages(SERVICE_KEY, bodyCity);
      // Trauma centers rarely change — skip unless forced
      if (forceRefresh) {
        traumaCenters = await fetchTraumaCenters(SERVICE_KEY);
      }
    }

    // Parse bed items
    const hospitals: ERData[] = [];
    for (const itemXml of bedItems) {
      const hpid = getValue(itemXml, 'hpid');
      const hospital: ERData = {
        hospitalId: hpid,
        hospitalName: getValue(itemXml, 'dutyName'),
        address: getValue(itemXml, 'dutyAddr'),
        phone: getValue(itemXml, 'dutyTel3') || getValue(itemXml, 'dutyTel1'),
        generalBeds: getNumValue(itemXml, 'hvec'),
        pediatricBeds: getNumValue(itemXml, 'hvicc'),
        feverBeds: getNumValue(itemXml, 'hvs01'),
        icuBeds: getNumValue(itemXml, 'hvcc'),
        surgicalIcuBeds: getNumValue(itemXml, 'hv2'),
        medicalIcuBeds: getNumValue(itemXml, 'hv3'),
        operatingRooms: getNumValue(itemXml, 'hvoc'),
        neonatalIcuBeds: getNumValue(itemXml, 'hvncc'),
        equipment: {
          ct: getBoolValue(itemXml, 'hvctayn'),
          mri: getBoolValue(itemXml, 'hvmriayn'),
          angio: getBoolValue(itemXml, 'hvangio'),
          ventilator: getBoolValue(itemXml, 'hvventiayn'),
          ecmo: getBoolValue(itemXml, 'hvecmoayn'),
          incubator: getBoolValue(itemXml, 'hvincuayn'),
        },
        erDivision: getValue(itemXml, 'dutyDiv'),
        traumaYn: getValue(itemXml, 'MKioskTy28'),
        lat: parseFloat(getValue(itemXml, 'wgs84Lat')) || undefined,
        lng: parseFloat(getValue(itemXml, 'wgs84Lon')) || undefined,
        isTraumaCenter: traumaCenters.has(hpid),
        acceptance: acceptanceData.get(hpid),
        alertMessage: messagesData.get(hpid),
      };
      if (hospital.hospitalId && hospital.hospitalName) hospitals.push(hospital);
    }

    console.log(`Parsed ${hospitals.length} hospitals with enriched data`);
    console.log(`- Trauma centers: ${hospitals.filter(h => h.isTraumaCenter).length}`);
    console.log(`- With acceptance data: ${hospitals.filter(h => h.acceptance).length}`);
    console.log(`- With messages: ${hospitals.filter(h => h.alertMessage).length}`);

    // Save to DB with data_source='api'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && hospitals.length > 0) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const hpids = hospitals.map(h => h.hospitalId);
      const { data: hospitalRecords } = await supabase
        .from('hospitals').select('id, hpid').in('hpid', hpids);

      if (hospitalRecords && hospitalRecords.length > 0) {
        const hpidToId = new Map(hospitalRecords.map(h => [h.hpid, h.id]));
        const statusUpdates = hospitals
          .filter(h => hpidToId.has(h.hospitalId))
          .map(h => ({
            hospital_id: hpidToId.get(h.hospitalId)!,
            hpid: h.hospitalId,
            general_beds: h.generalBeds,
            pediatric_beds: h.pediatricBeds,
            isolation_beds: h.feverBeds,
            last_updated: new Date().toISOString(),
            data_source: 'api',
          }));

        if (statusUpdates.length > 0) {
          const hospitalIds = statusUpdates.map(s => s.hospital_id);
          await supabase.from('hospital_status_cache').delete().in('hospital_id', hospitalIds);
          const { error: upsertError } = await supabase.from('hospital_status_cache').insert(statusUpdates);
          if (upsertError) console.error('Error saving bed status:', upsertError);
          else console.log(`Saved ${statusUpdates.length} bed status records (data_source=api)`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true, data: hospitals, count: hospitals.length,
        city: bodyCity, district: bodyDistrict, timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching ER data:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, useMockData: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
