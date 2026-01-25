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
  emergency_grade: string | null;
}

// Parse emergency grade from dutyEmclsName field
function parseEmergencyGrade(dutyEmclsName: string): string | null {
  if (!dutyEmclsName) return null;
  
  // 권역응급의료센터 (Regional Emergency Medical Center)
  if (dutyEmclsName.includes('권역응급의료센터') || dutyEmclsName.includes('권역')) {
    return 'regional_center';
  }
  // 지역응급의료센터 (Local Emergency Medical Center)
  if (dutyEmclsName.includes('지역응급의료센터')) {
    return 'local_center';
  }
  // 지역응급의료기관 (Local Emergency Medical Institution)
  if (dutyEmclsName.includes('지역응급의료기관')) {
    return 'local_institution';
  }
  
  return null;
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

// Fetch hospital list info (includes reliable coordinates) using getEgytListInfoInqire
async function fetchHospitalListInfo(
  serviceKey: string,
  region: { code: string; id: string }
): Promise<Map<string, { lat: number; lng: number; address: string; phone: string; name: string }>> {
  const infoMap = new Map<string, { lat: number; lng: number; address: string; phone: string; name: string }>();
  
  try {
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);
    
    // Use getEgytListInfoInqire which has more reliable coordinate data
    const url = `http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytListInfoInqire?serviceKey=${encodedKey}&Q0=${encodeURIComponent(region.code)}&pageNo=1&numOfRows=300`;
    
    console.log(`Fetching list info for ${region.code}...`);
    
    const response = await fetch(url, { headers: { 'Accept': 'application/xml' } });
    
    if (!response.ok) {
      console.error(`List info API error: ${response.status}`);
      return infoMap;
    }
    
    const xmlText = await response.text();
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    console.log(`List API returned ${items.length} items for ${region.code}`);
    
    for (const item of items) {
      const hpid = getValue(item, 'hpid');
      if (!hpid) continue;
      
      const lat = parseFloat(getValue(item, 'wgs84Lat'));
      const lng = parseFloat(getValue(item, 'wgs84Lon'));
      const address = getValue(item, 'dutyAddr');
      const phone = getValue(item, 'dutyTel1') || getValue(item, 'dutyTel3');
      const name = getValue(item, 'dutyName');
      
      if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        infoMap.set(hpid, { lat, lng, address, phone, name });
      }
    }
    
    console.log(`Got coordinates for ${infoMap.size} hospitals from list API in ${region.code}`);
  } catch (error) {
    console.error(`Error fetching list info for ${region.code}:`, error);
  }
  
  return infoMap;
}

// Fetch real-time bed info and merge with list info
async function fetchRegionHospitals(
  serviceKey: string,
  region: { code: string; id: string },
  listInfoMap: Map<string, { lat: number; lng: number; address: string; phone: string; name: string }>
): Promise<HospitalData[]> {
  const hospitals: HospitalData[] = [];
  const processedHpids = new Set<string>();
  
  try {
    const baseUrl = 'http://apis.data.go.kr/B552657/ErmctInfoInqireService';
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);
    const url = `${baseUrl}/getEmrrmRltmUsefulSckbdInfoInqire?serviceKey=${encodedKey}&STAGE1=${encodeURIComponent(region.code)}&pageNo=1&numOfRows=300`;
    
    console.log(`Fetching realtime bed info for ${region.code}...`);
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/xml' }
    });

    if (!response.ok) {
      console.error(`Realtime API error for ${region.code}: ${response.status}`);
    } else {
      const xmlText = await response.text();
      const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      console.log(`Realtime API found ${items.length} hospitals in ${region.code}`);
      
      for (const item of items) {
        const hpid = getValue(item, 'hpid');
        if (!hpid || processedHpids.has(hpid)) continue;
        
        // Get coordinates from list info API (more reliable)
        const listInfo = listInfoMap.get(hpid);
        
        // Use list info coordinates, fallback to realtime API coordinates
        let lat = listInfo?.lat || parseFloat(getValue(item, 'wgs84Lat')) || 0;
        let lng = listInfo?.lng || parseFloat(getValue(item, 'wgs84Lon')) || 0;
        
        // Skip hospitals without valid coordinates
        if (!lat || !lng || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
          console.log(`Skipping ${getValue(item, 'dutyName')} - no coordinates from realtime`);
          continue;
        }
        
        processedHpids.add(hpid);
        
        const dutyEmclsName = getValue(item, 'dutyEmclsName') || '';
        
        const hospital: HospitalData = {
          hpid,
          name: listInfo?.name || getValue(item, 'dutyName'),
          address: listInfo?.address || getValue(item, 'dutyAddr'),
          phone: listInfo?.phone || getValue(item, 'dutyTel3') || getValue(item, 'dutyTel1') || null,
          lat,
          lng,
          category: dutyEmclsName || '응급의료기관',
          region: region.id,
          is_trauma_center: false,
          has_pediatric: getNumValue(item, 'hvec') > 0 || getNumValue(item, 'hv28') > 0,
          equipment: [],
          emergency_grade: parseEmergencyGrade(dutyEmclsName),
        };
        
        // Parse equipment
        if (getNumValue(item, 'hvctayn') > 0) hospital.equipment.push('CT');
        if (getNumValue(item, 'hvmriayn') > 0) hospital.equipment.push('MRI');
        if (getNumValue(item, 'hvventiayn') > 0) hospital.equipment.push('Ventilator');
        
        hospitals.push(hospital);
      }
    }
    
    // Also add hospitals from list info that aren't in realtime data
    for (const [hpid, info] of listInfoMap.entries()) {
      if (processedHpids.has(hpid)) continue;
      
      hospitals.push({
        hpid,
        name: info.name,
        address: info.address,
        phone: info.phone || null,
        lat: info.lat,
        lng: info.lng,
        category: '응급의료기관',
        region: region.id,
        is_trauma_center: false,
        has_pediatric: false,
        equipment: [],
        emergency_grade: null,
      });
      
      processedHpids.add(hpid);
    }
    
    console.log(`Total ${hospitals.length} hospitals with valid coordinates in ${region.code}`);
  } catch (error) {
    console.error(`Error fetching ${region.code}:`, error);
  }
  
  return hospitals;
}

// Fetch trauma centers
async function fetchTraumaCenters(serviceKey: string): Promise<Set<string>> {
  const traumaCenters = new Set<string>();
  
  try {
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

    // Fetch hospitals for each region
    const allHospitals: HospitalData[] = [];
    
    for (const region of targetRegions) {
      // First fetch list info (with reliable coordinates)
      const listInfoMap = await fetchHospitalListInfo(serviceKey, region);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Then fetch realtime bed info and merge
      const hospitals = await fetchRegionHospitals(serviceKey, region, listInfoMap);
      
      // Mark trauma centers
      hospitals.forEach(h => {
        if (traumaCenters.has(h.hpid)) {
          h.is_trauma_center = true;
        }
      });
      
      allHospitals.push(...hospitals);
      
      // Rate limiting between regions
      await new Promise(resolve => setTimeout(resolve, 500));
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
