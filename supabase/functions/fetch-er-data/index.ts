import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_ENDPOINT = "http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire";

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

    const params = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      STAGE1: bodyCity,
      numOfRows: '100',
      pageNo: '1',
    });

    if (bodyDistrict) {
      params.append('STAGE2', bodyDistrict);
    }

    const apiUrl = `${API_ENDPOINT}?${params.toString()}`;
    console.log(`Fetching ER data for: ${bodyCity} ${bodyDistrict}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
      },
    });

    if (!response.ok) {
      console.error(`API returned status: ${response.status}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `API returned status ${response.status}`,
          useMockData: true 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    const xmlText = await response.text();
    console.log(`Received XML response (first 500 chars): ${xmlText.substring(0, 500)}`);

    // Parse XML response
    const hospitals: ERData[] = [];
    
    // Simple regex-based XML parsing for the response
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      
      const getValue = (tag: string): string => {
        const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
        const result = regex.exec(itemXml);
        return result ? result[1].trim() : '';
      };

      const getNumValue = (tag: string): number => {
        const val = getValue(tag);
        return val ? parseInt(val, 10) || 0 : 0;
      };

      const hospital: ERData = {
        hospitalId: getValue('hpid'),
        hospitalName: getValue('dutyName'),
        address: getValue('dutyAddr'),
        phone: getValue('dutyTel3') || getValue('dutyTel1'),
        generalBeds: getNumValue('hvec'), // 응급실 일반 병상
        pediatricBeds: getNumValue('hvoc'), // 소아 병상
        feverBeds: getNumValue('hv29') + getNumValue('hv30'), // 음압격리병상 + 일반격리병상
        lat: parseFloat(getValue('wgs84Lat')) || undefined,
        lng: parseFloat(getValue('wgs84Lon')) || undefined,
      };

      if (hospital.hospitalId && hospital.hospitalName) {
        hospitals.push(hospital);
      }
    }

    console.log(`Parsed ${hospitals.length} hospitals from API response`);

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
