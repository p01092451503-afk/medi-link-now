import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://find-er.kr',
  'https://www.find-er.kr',
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

interface HospitalData {
  hpid?: string;
  name: string;
  name_en?: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  entrance_lat?: number;
  entrance_lng?: number;
  category?: string;
  region: string;
  sub_region?: string;
  is_trauma_center?: boolean;
  has_pediatric?: boolean;
  equipment?: string[];
}

// Parse region from address to get region code
function getRegionFromAddress(address: string): { region: string; sub_region?: string } {
  const regionMappings: Record<string, { region: string; sub_region?: string }> = {
    '서울': { region: 'seoul' },
    '인천': { region: 'incheon' },
    '경기': { region: 'gyeonggi' },
    '부산': { region: 'busan' },
    '대구': { region: 'daegu' },
    '대전': { region: 'daejeon' },
    '광주': { region: 'gwangju' },
    '울산': { region: 'ulsan' },
    '세종': { region: 'sejong' },
    '강원': { region: 'gangwon' },
    '충북': { region: 'chungbuk' },
    '충남': { region: 'chungnam' },
    '전북': { region: 'jeonbuk' },
    '전남': { region: 'jeonnam' },
    '경북': { region: 'gyeongbuk' },
    '경남': { region: 'gyeongnam' },
    '제주': { region: 'jeju' },
  };

  for (const [key, value] of Object.entries(regionMappings)) {
    if (address.includes(key)) {
      return value;
    }
  }
  
  return { region: 'seoul' }; // default
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, hospitals } = await req.json();

    if (action === 'sync') {
      if (!hospitals || !Array.isArray(hospitals)) {
        return new Response(
          JSON.stringify({ error: 'hospitals array is required' }),
          { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      const results = {
        inserted: 0,
        updated: 0,
        errors: [] as string[],
      };

      for (const hospital of hospitals) {
        const regionInfo = getRegionFromAddress(hospital.address || hospital.region || '');
        
        const hospitalData: HospitalData = {
          hpid: hospital.hpid || `local-${hospital.id}`,
          name: hospital.nameKr || hospital.name,
          name_en: hospital.name,
          address: hospital.address,
          phone: hospital.phone,
          lat: hospital.lat,
          lng: hospital.lng,
          entrance_lat: hospital.entrance_lat,
          entrance_lng: hospital.entrance_lng,
          category: hospital.category || '응급의료기관',
          region: regionInfo.region,
          sub_region: regionInfo.sub_region,
          is_trauma_center: hospital.isTraumaCenter || false,
          has_pediatric: (hospital.beds?.pediatric || 0) > 0,
          equipment: hospital.equipment || [],
        };

        const { error } = await supabase
          .from('hospitals')
          .upsert(hospitalData, { onConflict: 'hpid' });

        if (error) {
          console.error(`Error upserting hospital ${hospital.nameKr}:`, error);
          results.errors.push(`${hospital.nameKr}: ${error.message}`);
        } else {
          results.inserted++;
        }
      }

      console.log(`Sync complete: ${results.inserted} hospitals synced, ${results.errors.length} errors`);

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'fetch') {
      const serviceKey = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
      
      if (!serviceKey) {
        return new Response(
          JSON.stringify({ error: 'PUBLIC_DATA_PORTAL_KEY not configured' }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
      }

      const city = req.headers.get('x-city') || '서울특별시';
      const baseUrl = 'http://apis.data.go.kr/B552657/ErmctInfoInqireService';
      const bedsUrl = `${baseUrl}/getEmrrmRltmUsefulSckbdInfoInqire?serviceKey=${serviceKey}&STAGE1=${encodeURIComponent(city)}&pageNo=1&numOfRows=100`;

      const response = await fetch(bedsUrl);
      const xmlText = await response.text();

      const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
      const results = {
        fetched: items.length,
        synced: 0,
        errors: [] as string[],
      };

      for (const item of items) {
        const getValue = (tag: string): string => {
          const match = item.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
          return match ? match[1].trim() : '';
        };

        const getNumValue = (tag: string): number => {
          const val = getValue(tag);
          return val ? parseInt(val, 10) || 0 : 0;
        };

        const hpid = getValue('hpid');
        if (!hpid) continue;

        const hospitalData: HospitalData = {
          hpid,
          name: getValue('dutyName'),
          address: getValue('dutyAddr'),
          phone: getValue('dutyTel3') || getValue('dutyTel1'),
          lat: parseFloat(getValue('wgs84Lat')) || 0,
          lng: parseFloat(getValue('wgs84Lon')) || 0,
          category: '응급의료기관',
          region: 'seoul',
          is_trauma_center: false,
          has_pediatric: getNumValue('hvec') > 0,
          equipment: [],
        };

        const regionInfo = getRegionFromAddress(hospitalData.address);
        hospitalData.region = regionInfo.region;
        hospitalData.sub_region = regionInfo.sub_region;

        const { error } = await supabase
          .from('hospitals')
          .upsert(hospitalData, { onConflict: 'hpid' });

        if (error) {
          results.errors.push(`${hospitalData.name}: ${error.message}`);
        } else {
          results.synced++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "sync" or "fetch"' }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-hospitals:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
