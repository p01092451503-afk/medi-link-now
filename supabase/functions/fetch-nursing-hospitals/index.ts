import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 전국 요양병원 정보 API (건강보험심사평가원)
const API_URL = "http://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList";

interface NursingHospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  type: string; // 요양병원, 요양원 등
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceKey = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    if (!serviceKey) {
      console.error('PUBLIC_DATA_PORTAL_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const sidoCd = url.searchParams.get('sidoCd') || ''; // 시도코드
    const sgguCd = url.searchParams.get('sgguCd') || ''; // 시군구코드
    const pageNo = url.searchParams.get('pageNo') || '1';
    const numOfRows = url.searchParams.get('numOfRows') || '100';

    console.log(`Fetching nursing hospitals: sidoCd=${sidoCd}, pageNo=${pageNo}`);

    // Build API URL with parameters
    // 요양병원 clCd = 31, 요양원 clCd = 41
    const params = new URLSearchParams({
      serviceKey: serviceKey,
      pageNo: pageNo,
      numOfRows: numOfRows,
      clCd: '31', // 요양병원
    });

    if (sidoCd) params.append('sidoCd', sidoCd);
    if (sgguCd) params.append('sgguCd', sgguCd);

    const apiUrl = `${API_URL}?${params.toString()}`;
    console.log('API URL:', apiUrl.replace(serviceKey, 'HIDDEN'));

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/xml',
      },
    });

    if (!response.ok) {
      console.error('API request failed:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: `API request failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const xmlText = await response.text();
    console.log('Response length:', xmlText.length);

    // Check for API error
    if (xmlText.includes('<errMsg>')) {
      const errMsg = getValue(xmlText, 'errMsg');
      console.error('API Error:', errMsg);
      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse hospital items
    const hospitals: NursingHospital[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const item = match[1];
      
      const lat = getFloatValue(item, 'YPos') || getFloatValue(item, 'yPos');
      const lng = getFloatValue(item, 'XPos') || getFloatValue(item, 'xPos');
      
      // Skip if no valid coordinates
      if (!lat || !lng || lat < 33 || lat > 39 || lng < 124 || lng > 132) {
        continue;
      }

      const hospital: NursingHospital = {
        id: getValue(item, 'ykiho') || getValue(item, 'hpid') || `nh-${hospitals.length}`,
        name: getValue(item, 'yadmNm') || getValue(item, 'dutyName') || '알 수 없음',
        address: getValue(item, 'addr') || getValue(item, 'dutyAddr') || '',
        phone: getValue(item, 'telno') || getValue(item, 'dutyTel1') || '',
        lat,
        lng,
        type: '요양병원',
        beds: getNumValue(item, 'hospBdCnt') || getNumValue(item, 'cmdcGdrCnt') || 0,
      };

      hospitals.push(hospital);
    }

    console.log(`Parsed ${hospitals.length} nursing hospitals`);

    // Get total count from response
    const totalCount = getNumValue(xmlText, 'totalCount') || hospitals.length;

    return new Response(
      JSON.stringify({
        success: true,
        data: hospitals,
        totalCount,
        pageNo: parseInt(pageNo),
        numOfRows: parseInt(numOfRows),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error fetching nursing hospitals:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
