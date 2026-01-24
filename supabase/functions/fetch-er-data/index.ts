import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Endpoints from National Emergency Medical Center
const API_BASE = "http://apis.data.go.kr/B552657/ErmctInfoInqireService";
const API_ENDPOINTS = {
  // Real-time ER bed availability
  beds: `${API_BASE}/getEmrrmRltmUsefulSckbdInfoInqire`,
  // Severe disease acceptance (procedure availability)
  acceptance: `${API_BASE}/getSrsillDissAcceptncPosblInfoInqire`,
  // Real-time hospital messages
  messages: `${API_BASE}/getEmrrmSrsillDissMsgInqire`,
  // Trauma center list
  trauma: "http://apis.data.go.kr/B552657/ErmctInfoInqireService/getStrmListInfoInqire",
};

interface ERData {
  hospitalId: string;
  hospitalName: string;
  address: string;
  phone: string;
  generalBeds: number;
  pediatricBeds: number;
  feverBeds: number;
  lat?: number;
  lng?: number;
  // New fields
  isTraumaCenter?: boolean;
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

// Fetch severe disease acceptance data
async function fetchAcceptanceData(serviceKey: string, city: string): Promise<Map<string, ERData['acceptance']>> {
  const acceptanceMap = new Map<string, ERData['acceptance']>();
  
  try {
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);
    const url = `${API_ENDPOINTS.acceptance}?serviceKey=${encodedKey}&STAGE1=${encodeURIComponent(city)}&numOfRows=100&pageNo=1`;
    
    console.log("Fetching acceptance data...");
    const response = await fetch(url, { headers: { 'Accept': 'application/xml' } });
    
    if (!response.ok) {
      console.error("Acceptance API failed:", response.status);
      return acceptanceMap;
    }
    
    const xmlText = await response.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      const hpid = getValue(itemXml, 'hpid');
      
      if (hpid) {
        acceptanceMap.set(hpid, {
          heart: getBoolValue(itemXml, 'MKioskTy1'),      // 심근경색
          brainBleed: getBoolValue(itemXml, 'MKioskTy2'), // 뇌출혈
          brainStroke: getBoolValue(itemXml, 'MKioskTy3'), // 뇌경색
          endoscopy: getBoolValue(itemXml, 'MKioskTy4'),  // 응급내시경
          dialysis: getBoolValue(itemXml, 'MKioskTy5'),   // 응급투석
        });
      }
    }
    
    console.log(`Fetched ${acceptanceMap.size} acceptance records`);
  } catch (error) {
    console.error("Error fetching acceptance data:", error);
  }
  
  return acceptanceMap;
}

// Fetch real-time hospital messages
async function fetchMessages(serviceKey: string, city: string): Promise<Map<string, string>> {
  const messagesMap = new Map<string, string>();
  
  try {
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);
    const url = `${API_ENDPOINTS.messages}?serviceKey=${encodedKey}&STAGE1=${encodeURIComponent(city)}&numOfRows=100&pageNo=1`;
    
    console.log("Fetching hospital messages...");
    const response = await fetch(url, { headers: { 'Accept': 'application/xml' } });
    
    if (!response.ok) {
      console.error("Messages API failed:", response.status);
      return messagesMap;
    }
    
    const xmlText = await response.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      const hpid = getValue(itemXml, 'hpid');
      const message = getValue(itemXml, 'symBlkMsg') || getValue(itemXml, 'msgType');
      
      if (hpid && message) {
        messagesMap.set(hpid, message);
      }
    }
    
    console.log(`Fetched ${messagesMap.size} hospital messages`);
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
  
  return messagesMap;
}

// Fetch trauma center list
async function fetchTraumaCenters(serviceKey: string): Promise<Set<string>> {
  const traumaSet = new Set<string>();
  
  try {
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);
    const url = `${API_ENDPOINTS.trauma}?serviceKey=${encodedKey}&numOfRows=100&pageNo=1`;
    
    console.log("Fetching trauma center list...");
    const response = await fetch(url, { headers: { 'Accept': 'application/xml' } });
    
    if (!response.ok) {
      console.error("Trauma API failed:", response.status);
      return traumaSet;
    }
    
    const xmlText = await response.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      const hpid = getValue(itemXml, 'hpid');
      
      if (hpid) {
        traumaSet.add(hpid);
      }
    }
    
    console.log(`Found ${traumaSet.size} trauma centers`);
  } catch (error) {
    console.error("Error fetching trauma centers:", error);
  }
  
  return traumaSet;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SERVICE_KEY = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    
    if (!SERVICE_KEY) {
      console.log("PUBLIC_DATA_PORTAL_KEY not found, returning mock indication");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "API key not configured",
          useMockData: true 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || '서울특별시';
    const district = searchParams.get('district') || '';
    
    // Also accept POST body
    let bodyCity = city;
    let bodyDistrict = district;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        bodyCity = body.city || city;
        bodyDistrict = body.district || district;
      } catch {
        // Use query params if body parsing fails
      }
    }

    const isAlreadyEncoded = SERVICE_KEY.includes('%');
    const encodedKey = isAlreadyEncoded ? SERVICE_KEY : encodeURIComponent(SERVICE_KEY);
    
    let apiUrl = `${API_ENDPOINTS.beds}?serviceKey=${encodedKey}&STAGE1=${encodeURIComponent(bodyCity)}&numOfRows=100&pageNo=1`;

    if (bodyDistrict) {
      apiUrl += `&STAGE2=${encodeURIComponent(bodyDistrict)}`;
    }

    console.log(`Fetching ER data for: ${bodyCity} ${bodyDistrict}`);

    // Fetch all data in parallel
    const [bedsResponse, acceptanceData, messagesData, traumaCenters] = await Promise.all([
      fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/xml' } }),
      fetchAcceptanceData(SERVICE_KEY, bodyCity),
      fetchMessages(SERVICE_KEY, bodyCity),
      fetchTraumaCenters(SERVICE_KEY),
    ]);

    if (!bedsResponse.ok) {
      console.error(`Beds API returned status: ${bedsResponse.status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `API returned status ${bedsResponse.status}`,
          useMockData: true 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    const xmlText = await bedsResponse.text();
    console.log(`Received beds XML response (first 500 chars): ${xmlText.substring(0, 500)}`);

    // Parse XML response
    const hospitals: ERData[] = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      const hpid = getValue(itemXml, 'hpid');

      const hospital: ERData = {
        hospitalId: hpid,
        hospitalName: getValue(itemXml, 'dutyName'),
        address: getValue(itemXml, 'dutyAddr'),
        phone: getValue(itemXml, 'dutyTel3') || getValue(itemXml, 'dutyTel1'),
        generalBeds: getNumValue(itemXml, 'hvec'), // 응급실 일반 병상
        pediatricBeds: getNumValue(itemXml, 'hvoc'), // 소아 병상
        feverBeds: getNumValue(itemXml, 'hv29') + getNumValue(itemXml, 'hv30'), // 음압격리병상 + 일반격리병상
        lat: parseFloat(getValue(itemXml, 'wgs84Lat')) || undefined,
        lng: parseFloat(getValue(itemXml, 'wgs84Lon')) || undefined,
        // Enrich with additional data
        isTraumaCenter: traumaCenters.has(hpid),
        acceptance: acceptanceData.get(hpid),
        alertMessage: messagesData.get(hpid),
      };

      if (hospital.hospitalId && hospital.hospitalName) {
        hospitals.push(hospital);
      }
    }

    console.log(`Parsed ${hospitals.length} hospitals with enriched data`);
    console.log(`- Trauma centers: ${hospitals.filter(h => h.isTraumaCenter).length}`);
    console.log(`- With acceptance data: ${hospitals.filter(h => h.acceptance).length}`);
    console.log(`- With messages: ${hospitals.filter(h => h.alertMessage).length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: hospitals,
        count: hospitals.length,
        city: bodyCity,
        district: bodyDistrict,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching ER data:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        useMockData: true 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  }
});
