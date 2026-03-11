// @deno-std v0.224.0 — updated 2026-03
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://find-bed-now.lovable.app',
  'https://id-preview--0014984b-817e-4711-bddc-15810d8fceb9.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// API Endpoint for hospital basic information
const API_BASE = "http://apis.data.go.kr/B552657/ErmctInfoInqireService";
const API_ENDPOINT = `${API_BASE}/getEgytBassInfoInqire`;

interface HospitalDetailData {
  hpid: string;
  hospitalName: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  // Operating hours by day (1=Mon, 2=Tue, ..., 7=Sun, 8=Holiday)
  operatingHours: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
    holiday?: { start: string; end: string };
  };
  // Specialty departments
  departments: string[];
  // Emergency room characteristics
  emergencyRoomType?: string;
  // Special facilities
  hasPediatric: boolean;
  hasNightCare: boolean;
  specialties: {
    isWomenSpecialty: boolean;
    isChildSpecialty: boolean;
    isTraumaCenter: boolean;
  };
  lat?: number;
  lng?: number;
}

// Parse XML value helper
const getValue = (xml: string, tag: string): string => {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const result = regex.exec(xml);
  return result ? result[1].trim() : '';
};

// Parse time string (e.g., "0900" -> "09:00")
const parseTime = (time: string): string => {
  if (!time || time.length < 4) return '';
  return `${time.slice(0, 2)}:${time.slice(2, 4)}`;
};

// Check if hospital operates at night (after 21:00)
const checkNightCare = (operatingHours: HospitalDetailData['operatingHours']): boolean => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  
  for (const day of days) {
    const hours = operatingHours[day];
    if (hours?.end) {
      const endHour = parseInt(hours.end.replace(':', ''), 10);
      if (endHour >= 2100 || endHour < 600) {
        return true;
      }
    }
  }
  return false;
};

// Check if hospital is women/child specialty based on name and departments
const checkSpecialties = (name: string, departments: string[]): { isWomenSpecialty: boolean; isChildSpecialty: boolean } => {
  const nameLower = name.toLowerCase();
  const deptString = departments.join(' ').toLowerCase();
  
  // Women specialty keywords
  const womenKeywords = ['여성', '산부인과', '산부', '여의', '레이디', '마리아', '미즈'];
  const isWomenSpecialty = womenKeywords.some(k => nameLower.includes(k) || deptString.includes(k));
  
  // Child specialty keywords
  const childKeywords = ['소아', '어린이', '아동', '키즈', '영유아'];
  const isChildSpecialty = childKeywords.some(k => nameLower.includes(k) || deptString.includes(k));
  
  return { isWomenSpecialty, isChildSpecialty };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const SERVICE_KEY = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    
    if (!SERVICE_KEY) {
      console.log("PUBLIC_DATA_PORTAL_KEY not found");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "API key not configured" 
        }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get request parameters
    let hpid = '';
    let city = '서울특별시';
    let district = '';
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        hpid = body.hpid || '';
        city = body.city || '서울특별시';
        district = body.district || '';
      } catch {
        // Fallback to query params
      }
    }

    const { searchParams } = new URL(req.url);
    hpid = hpid || searchParams.get('hpid') || '';
    city = city || searchParams.get('city') || '서울특별시';
    district = district || searchParams.get('district') || '';

    const isAlreadyEncoded = SERVICE_KEY.includes('%');
    const encodedKey = isAlreadyEncoded ? SERVICE_KEY : encodeURIComponent(SERVICE_KEY);
    
    let apiUrl = `${API_ENDPOINT}?serviceKey=${encodedKey}&numOfRows=100&pageNo=1`;
    
    if (hpid) {
      apiUrl += `&HPID=${encodeURIComponent(hpid)}`;
    } else {
      apiUrl += `&STAGE1=${encodeURIComponent(city)}`;
      if (district) {
        apiUrl += `&STAGE2=${encodeURIComponent(district)}`;
      }
    }

    console.log(`Fetching hospital details: ${hpid ? `hpid=${hpid}` : `city=${city}, district=${district}`}`);

    const response = await fetch(apiUrl, { 
      method: 'GET', 
      headers: { 'Accept': 'application/xml' } 
    });

    if (!response.ok) {
      console.error(`API returned status: ${response.status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `API returned status ${response.status}` 
        }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 200 }
      );
    }

    const xmlText = await response.text();
    console.log(`Received XML response (first 500 chars): ${xmlText.substring(0, 500)}`);

    // Parse XML response
    const hospitals: HospitalDetailData[] = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      
      const hospitalName = getValue(itemXml, 'dutyName');
      const hospitalId = getValue(itemXml, 'hpid');
      
      // Parse operating hours for each day
      const operatingHours: HospitalDetailData['operatingHours'] = {};
      
      const dayMapping: Record<string, keyof HospitalDetailData['operatingHours']> = {
        '1': 'monday', '2': 'tuesday', '3': 'wednesday', '4': 'thursday',
        '5': 'friday', '6': 'saturday', '7': 'sunday', '8': 'holiday'
      };
      
      for (const [num, day] of Object.entries(dayMapping)) {
        const start = getValue(itemXml, `dutyTime${num}s`);
        const end = getValue(itemXml, `dutyTime${num}c`);
        
        if (start || end) {
          operatingHours[day] = {
            start: parseTime(start),
            end: parseTime(end)
          };
        }
      }
      
      // Parse departments (진료과목)
      const dgidIdName = getValue(itemXml, 'dgidIdName');
      const departments = dgidIdName 
        ? dgidIdName.split(',').map(d => d.trim()).filter(Boolean)
        : [];
      
      // Check specialties
      const { isWomenSpecialty, isChildSpecialty } = checkSpecialties(hospitalName, departments);
      const hasNightCare = checkNightCare(operatingHours);
      
      // Check if has pediatric based on departments or name
      const hasPediatric = departments.some(d => 
        d.includes('소아') || d.includes('아동')
      ) || hospitalName.includes('소아') || hospitalName.includes('어린이');

      const hospital: HospitalDetailData = {
        hpid: hospitalId,
        hospitalName,
        address: getValue(itemXml, 'dutyAddr'),
        phone: getValue(itemXml, 'dutyTel1'),
        emergencyPhone: getValue(itemXml, 'dutyTel3'),
        operatingHours,
        departments,
        emergencyRoomType: getValue(itemXml, 'dutyEryn') === '1' ? '응급실운영' : undefined,
        hasPediatric,
        hasNightCare,
        specialties: {
          isWomenSpecialty,
          isChildSpecialty,
          isTraumaCenter: false, // Will be enriched from other API
        },
        lat: parseFloat(getValue(itemXml, 'wgs84Lat')) || undefined,
        lng: parseFloat(getValue(itemXml, 'wgs84Lon')) || undefined,
      };

      if (hospital.hpid && hospital.hospitalName) {
        hospitals.push(hospital);
      }
    }

    console.log(`Parsed ${hospitals.length} hospital details`);
    console.log(`- With night care: ${hospitals.filter(h => h.hasNightCare).length}`);
    console.log(`- Women specialty: ${hospitals.filter(h => h.specialties.isWomenSpecialty).length}`);
    console.log(`- Child specialty: ${hospitals.filter(h => h.specialties.isChildSpecialty).length}`);
    console.log(`- Has pediatric: ${hospitals.filter(h => h.hasPediatric).length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: hospitals,
        count: hospitals.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching hospital details:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 200 }
    );
  }
});
