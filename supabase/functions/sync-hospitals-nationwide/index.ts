import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All major regions in Korea
const REGIONS = [
  { code: '서울특별시', id: 'seoul' },
  { code: '인천광역시', id: 'incheon' },
  { code: '경기도', id: 'gyeonggi' },
  { code: '부산광역시', id: 'busan' },
  { code: '대구광역시', id: 'daegu' },
  { code: '대전광역시', id: 'daejeon' },
  { code: '광주광역시', id: 'gwangju' },
  { code: '울산광역시', id: 'ulsan' },
  { code: '세종특별자치시', id: 'sejong' },
  { code: '강원특별자치도', id: 'gangwon' },
  { code: '충청북도', id: 'chungbuk' },
  { code: '충청남도', id: 'chungnam' },
  { code: '전북특별자치도', id: 'jeonbuk' },
  { code: '전라남도', id: 'jeonnam' },
  { code: '경상북도', id: 'gyeongbuk' },
  { code: '경상남도', id: 'gyeongnam' },
  { code: '제주특별자치도', id: 'jeju' },
];

interface HospitalData {
  hpid: string;
  name: string;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  category: string;
  region: string;
  is_trauma_center: boolean;
  has_pediatric: boolean;
  equipment: string[];
}

// XML parsing helpers
function getValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1].trim() : '';
}

function getNumValue(xml: string, tag: string): number {
  const val = getValue(xml, tag);
  return val ? parseInt(val, 10) || 0 : 0;
}

// Fetch hospitals for a single region
async function fetchRegionHospitals(
  serviceKey: string,
  region: { code: string; id: string }
): Promise<HospitalData[]> {
  const hospitals: HospitalData[] = [];
  
  try {
    const baseUrl = 'http://apis.data.go.kr/B552657/ErmctInfoInqireService';
    // Handle API key encoding - check if already encoded
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);
    const url = `${baseUrl}/getEmrrmRltmUsefulSckbdInfoInqire?serviceKey=${encodedKey}&STAGE1=${encodeURIComponent(region.code)}&pageNo=1&numOfRows=200`;
    
    console.log(`Fetching hospitals for ${region.code}...`);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/xml' }
    });
    
    if (!response.ok) {
      console.error(`API error for ${region.code}: ${response.status}`);
      return hospitals;
    }
    
    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    console.log(`Found ${items.length} hospitals in ${region.code}`);
    
    for (const item of items) {
      const hpid = getValue(item, 'hpid');
      if (!hpid) continue;
      
      const lat = parseFloat(getValue(item, 'wgs84Lat')) || 0;
      const lng = parseFloat(getValue(item, 'wgs84Lon')) || 0;
      
      // Use default Seoul coordinates if missing (will be updated later)
      const finalLat = lat !== 0 ? lat : 37.5665;
      const finalLng = lng !== 0 ? lng : 126.978;
      
      const hospital: HospitalData = {
        hpid,
        name: getValue(item, 'dutyName'),
        address: getValue(item, 'dutyAddr'),
        phone: getValue(item, 'dutyTel3') || getValue(item, 'dutyTel1') || null,
        lat: finalLat,
        lng: finalLng,
        category: getValue(item, 'dutyEmclsName') || '응급의료기관',
        region: region.id,
        is_trauma_center: false,
        has_pediatric: getNumValue(item, 'hvec') > 0 || getNumValue(item, 'hv28') > 0,
        equipment: [],
      };
      
      // Parse equipment
      if (getNumValue(item, 'hvctayn') > 0) hospital.equipment.push('CT');
      if (getNumValue(item, 'hvmriayn') > 0) hospital.equipment.push('MRI');
      if (getNumValue(item, 'hvventiayn') > 0) hospital.equipment.push('Ventilator');
      if (getNumValue(item, 'hvventisoayn') > 0) hospital.equipment.push('Ventilator');
      
      hospitals.push(hospital);
    }
  } catch (error) {
    console.error(`Error fetching ${region.code}:`, error);
  }
  
  return hospitals;
}

// Fetch trauma centers
async function fetchTraumaCenters(serviceKey: string): Promise<Set<string>> {
  const traumaCenters = new Set<string>();
  
  try {
    // Handle API key encoding
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);
    const url = `http://apis.data.go.kr/B552657/ErmctInfoInqireService/getStrmListInfoInqire?serviceKey=${encodedKey}&pageNo=1&numOfRows=100`;
    
    const response = await fetch(url);
    if (!response.ok) return traumaCenters;
    
    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    for (const item of items) {
      const hpid = getValue(item, 'hpid');
      if (hpid) traumaCenters.add(hpid);
    }
    
    console.log(`Found ${traumaCenters.size} trauma centers`);
  } catch (error) {
    console.error('Error fetching trauma centers:', error);
  }
  
  return traumaCenters;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const serviceKey = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    if (!serviceKey) {
      console.error('PUBLIC_DATA_PORTAL_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional region filter
    let targetRegions = REGIONS;
    try {
      const body = await req.json();
      if (body.regions && Array.isArray(body.regions)) {
        targetRegions = REGIONS.filter(r => body.regions.includes(r.id));
      }
    } catch {
      // No body or invalid JSON, use all regions
    }

    console.log(`Starting nationwide sync for ${targetRegions.length} regions...`);

    // Fetch trauma centers first
    const traumaCenters = await fetchTraumaCenters(serviceKey);

    // Fetch hospitals for each region (with rate limiting)
    const allHospitals: HospitalData[] = [];
    
    for (const region of targetRegions) {
      const hospitals = await fetchRegionHospitals(serviceKey, region);
      
      // Mark trauma centers
      hospitals.forEach(h => {
        if (traumaCenters.has(h.hpid)) {
          h.is_trauma_center = true;
        }
      });
      
      allHospitals.push(...hospitals);
      
      // Rate limiting: wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Total hospitals fetched: ${allHospitals.length}`);

    // Upsert hospitals to database in batches
    const batchSize = 50;
    let inserted = 0;
    let errors: string[] = [];

    for (let i = 0; i < allHospitals.length; i += batchSize) {
      const batch = allHospitals.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('hospitals')
        .upsert(batch, { 
          onConflict: 'hpid',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Batch insert error:`, error);
        errors.push(error.message);
      } else {
        inserted += batch.length;
      }
    }

    const duration = Date.now() - startTime;
    
    const result = {
      success: true,
      stats: {
        regionsProcessed: targetRegions.length,
        hospitalsFound: allHospitals.length,
        hospitalsInserted: inserted,
        traumaCenters: traumaCenters.size,
        errors: errors.length,
        durationMs: duration,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Sync complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-hospitals-nationwide:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
