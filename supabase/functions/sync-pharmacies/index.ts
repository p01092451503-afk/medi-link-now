import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 약국 기본 목록 조회 API (전국)
const API_BASE_URL = "http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyBasisList";

// 시도 목록
const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도',
  '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도',
  '경상남도', '제주특별자치도',
];

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

// 야간 약국 여부 판별 (평일 기준 22시 이후 마감)
const checkIsNightPharmacy = (dutyTimes: Record<string, string>): boolean => {
  const closeFields = ['dutyTime1c', 'dutyTime2c', 'dutyTime3c', 'dutyTime4c', 'dutyTime5c'];
  return closeFields.some(field => {
    const closeTime = parseInt(dutyTimes[field] || '0', 10);
    return closeTime >= 2200 || (closeTime > 0 && closeTime < 400);
  });
};

// 24시 약국 여부 판별
const checkIs24h = (dutyTimes: Record<string, string>): boolean => {
  const openFields = ['dutyTime1s', 'dutyTime2s', 'dutyTime3s', 'dutyTime4s', 'dutyTime5s'];
  const closeFields = ['dutyTime1c', 'dutyTime2c', 'dutyTime3c', 'dutyTime4c', 'dutyTime5c'];

  // 평일 5일 중 3일 이상이 0000~2400 이면 24시로 간주
  let count24h = 0;
  for (let i = 0; i < openFields.length; i++) {
    const openTime = parseInt(dutyTimes[openFields[i]] || '9999', 10);
    const closeTime = parseInt(dutyTimes[closeFields[i]] || '0', 10);
    if (openTime === 0 && closeTime === 2400) {
      count24h++;
    }
  }
  return count24h >= 3;
};

// 한 페이지 데이터 가져오기
const fetchPage = async (serviceKey: string, region: string, pageNo: number, numOfRows: number): Promise<string> => {
  // serviceKey를 직접 삽입하여 이중 인코딩 방지
  const apiUrl = `${API_BASE_URL}?serviceKey=${serviceKey}&Q0=${encodeURIComponent(region)}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  return await response.text();
};

// XML 파싱: 총 결과 수
const getTotalCount = (xmlText: string): number => {
  return parseInt(getValue(xmlText, 'totalCount'), 10) || 0;
};

// XML 파싱: 약국 아이템 추출
const parseItems = (xmlText: string, region: string) => {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const items: Record<string, unknown>[] = [];
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const xml = match[1];
    const lat = getFloatValue(xml, 'wgs84Lat');
    const lng = getFloatValue(xml, 'wgs84Lon');
    if (!lat || !lng) continue;

    const name = getValue(xml, 'dutyName');
    if (!name) continue;

    const hpid = getValue(xml, 'hpid');

    const dutyTimes: Record<string, string> = {};
    for (let i = 1; i <= 8; i++) {
      dutyTimes[`dutyTime${i}s`] = getValue(xml, `dutyTime${i}s`);
      dutyTimes[`dutyTime${i}c`] = getValue(xml, `dutyTime${i}c`);
    }

    const isNight = checkIsNightPharmacy(dutyTimes);
    const is24h = checkIs24h(dutyTimes);

    items.push({
      hpid: hpid || null,
      name,
      address: getValue(xml, 'dutyAddr'),
      phone: getValue(xml, 'dutyTel1'),
      lat,
      lng,
      duty_time_1s: dutyTimes.dutyTime1s || null,
      duty_time_1c: dutyTimes.dutyTime1c || null,
      duty_time_2s: dutyTimes.dutyTime2s || null,
      duty_time_2c: dutyTimes.dutyTime2c || null,
      duty_time_3s: dutyTimes.dutyTime3s || null,
      duty_time_3c: dutyTimes.dutyTime3c || null,
      duty_time_4s: dutyTimes.dutyTime4s || null,
      duty_time_4c: dutyTimes.dutyTime4c || null,
      duty_time_5s: dutyTimes.dutyTime5s || null,
      duty_time_5c: dutyTimes.dutyTime5c || null,
      duty_time_6s: dutyTimes.dutyTime6s || null,
      duty_time_6c: dutyTimes.dutyTime6c || null,
      duty_time_7s: dutyTimes.dutyTime7s || null,
      duty_time_7c: dutyTimes.dutyTime7c || null,
      duty_time_8s: dutyTimes.dutyTime8s || null,
      duty_time_8c: dutyTimes.dutyTime8c || null,
      is_night_pharmacy: isNight,
      is_24h: is24h,
      region,
    });
  }

  return items;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const serviceKey = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    if (!serviceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'PUBLIC_DATA_PORTAL_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // URL 파라미터로 특정 지역만 동기화 가능
    const url = new URL(req.url);
    const targetRegion = url.searchParams.get('region');
    const regionsToSync = targetRegion ? [targetRegion] : REGIONS;
    const numOfRows = 1000; // 페이지당 최대 행 수

    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const regionResults: Record<string, { count: number; error?: string }> = {};

    for (const region of regionsToSync) {
      try {
        console.log(`[sync-pharmacies] Syncing region: ${region}`);

        // 1차 페이지 호출로 총 개수 확인
        const firstPageXml = await fetchPage(serviceKey, region, 1, numOfRows);

        // API 에러 체크
        if (firstPageXml.includes('<errMsg>') || firstPageXml.includes('<cmmMsgHeader>')) {
          const errMsg = getValue(firstPageXml, 'errMsg') || getValue(firstPageXml, 'returnAuthMsg');
          console.error(`[sync-pharmacies] API error for ${region}: ${errMsg}`);
          regionResults[region] = { count: 0, error: errMsg };
          totalErrors++;
          continue;
        }

        const totalCount = getTotalCount(firstPageXml);
        const totalPages = Math.ceil(totalCount / numOfRows);

        console.log(`[sync-pharmacies] ${region}: ${totalCount} pharmacies, ${totalPages} pages`);

        // 첫 페이지 데이터 파싱
        let allItems = parseItems(firstPageXml, region);

        // 2페이지 이상이면 추가 호출
        for (let page = 2; page <= totalPages; page++) {
          try {
            // API 부하 방지를 위한 딜레이
            await new Promise(resolve => setTimeout(resolve, 300));
            const pageXml = await fetchPage(serviceKey, region, page, numOfRows);
            const pageItems = parseItems(pageXml, region);
            allItems = allItems.concat(pageItems);
            console.log(`[sync-pharmacies] ${region} page ${page}/${totalPages}: ${pageItems.length} items`);
          } catch (pageErr) {
            console.error(`[sync-pharmacies] Error fetching page ${page} for ${region}:`, pageErr);
          }
        }

        // DB에 upsert (hpid 기준, 없으면 이름+좌표 기준)
        if (allItems.length > 0) {
          // hpid가 있는 것과 없는 것 분리
          const withHpid = allItems.filter(item => item.hpid);
          const withoutHpid = allItems.filter(item => !item.hpid);

          // hpid 기준 upsert (배치)
          if (withHpid.length > 0) {
            const batchSize = 500;
            for (let i = 0; i < withHpid.length; i += batchSize) {
              const batch = withHpid.slice(i, i + batchSize);
              const { error: upsertError } = await supabase
                .from('pharmacies')
                .upsert(batch, { onConflict: 'hpid', ignoreDuplicates: false });

              if (upsertError) {
                console.error(`[sync-pharmacies] Upsert error for ${region} batch ${i}:`, upsertError);
                totalErrors++;
              } else {
                totalInserted += batch.length;
              }
            }
          }

          // hpid 없는 것은 개별 insert (중복 체크)
          for (const item of withoutHpid) {
            const { data: existing } = await supabase
              .from('pharmacies')
              .select('id')
              .eq('name', item.name)
              .eq('lat', item.lat)
              .eq('lng', item.lng)
              .limit(1);

            if (existing && existing.length > 0) {
              const { error: updateErr } = await supabase
                .from('pharmacies')
                .update(item)
                .eq('id', existing[0].id);
              if (!updateErr) totalUpdated++;
            } else {
              const { error: insertErr } = await supabase
                .from('pharmacies')
                .insert(item);
              if (!insertErr) totalInserted++;
              else totalErrors++;
            }
          }

          regionResults[region] = { count: allItems.length };
        } else {
          regionResults[region] = { count: 0 };
        }

        // 지역 간 딜레이 (API rate limit 방지)
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (regionErr) {
        console.error(`[sync-pharmacies] Error syncing ${region}:`, regionErr);
        regionResults[region] = { count: 0, error: regionErr.message };
        totalErrors++;
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      totalInserted,
      totalUpdated,
      totalErrors,
      duration_ms: duration,
      regions: regionResults,
      timestamp: new Date().toISOString(),
    };

    console.log(`[sync-pharmacies] Complete: ${totalInserted} inserted, ${totalUpdated} updated, ${totalErrors} errors in ${duration}ms`);

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[sync-pharmacies] Fatal error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
