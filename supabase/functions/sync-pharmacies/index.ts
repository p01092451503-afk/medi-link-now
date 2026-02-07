import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 국립중앙의료원 약국 목록 정보 조회 API (위경도 기반)
const API_BASE_URL = "http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire";

const getValue = (xml: string, tag: string): string => {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const result = regex.exec(xml);
  return result ? result[1].trim() : '';
};

const getFloatValue = (xml: string, tag: string): number => {
  const val = getValue(xml, tag);
  return val ? parseFloat(val) || 0 : 0;
};

const checkIsNightPharmacy = (dutyTimes: Record<string, string>): boolean => {
  const closeFields = ['dutyTime1c', 'dutyTime2c', 'dutyTime3c', 'dutyTime4c', 'dutyTime5c'];
  return closeFields.some(field => {
    const closeTime = parseInt(dutyTimes[field] || '0', 10);
    return closeTime >= 2200 || (closeTime > 0 && closeTime < 400);
  });
};

const checkIs24h = (dutyTimes: Record<string, string>): boolean => {
  const openFields = ['dutyTime1s', 'dutyTime2s', 'dutyTime3s', 'dutyTime4s', 'dutyTime5s'];
  const closeFields = ['dutyTime1c', 'dutyTime2c', 'dutyTime3c', 'dutyTime4c', 'dutyTime5c'];
  let count24h = 0;
  for (let i = 0; i < openFields.length; i++) {
    const openTime = parseInt(dutyTimes[openFields[i]] || '9999', 10);
    const closeTime = parseInt(dutyTimes[closeFields[i]] || '0', 10);
    if (openTime === 0 && closeTime === 2400) count24h++;
  }
  return count24h >= 3;
};

// 주요 도시/지역의 대표 좌표 (전국 커버리지)
const REGION_GRID = [
  // 서울·수도권
  { name: '서울 중심', lat: 37.5665, lng: 126.9780 },
  { name: '서울 강남', lat: 37.4979, lng: 127.0276 },
  { name: '서울 강북', lat: 37.6396, lng: 127.0257 },
  { name: '서울 서부', lat: 37.5510, lng: 126.8687 },
  { name: '인천', lat: 37.4563, lng: 126.7052 },
  { name: '수원', lat: 37.2636, lng: 127.0286 },
  { name: '성남', lat: 37.4200, lng: 127.1267 },
  { name: '고양', lat: 37.6584, lng: 126.8320 },
  { name: '용인', lat: 37.2411, lng: 127.1776 },
  { name: '안양·안산', lat: 37.3219, lng: 126.8313 },
  { name: '파주·의정부', lat: 37.7381, lng: 127.0337 },
  { name: '평택', lat: 36.9921, lng: 127.1129 },
  // 충청
  { name: '대전', lat: 36.3504, lng: 127.3845 },
  { name: '세종', lat: 36.4800, lng: 127.2551 },
  { name: '청주', lat: 36.6424, lng: 127.4890 },
  { name: '천안', lat: 36.8151, lng: 127.1139 },
  { name: '충주', lat: 36.9910, lng: 127.9259 },
  // 전라
  { name: '광주', lat: 35.1595, lng: 126.8526 },
  { name: '전주', lat: 35.8242, lng: 127.1480 },
  { name: '목포', lat: 34.8118, lng: 126.3922 },
  { name: '여수', lat: 34.7604, lng: 127.6622 },
  // 경상
  { name: '부산 중심', lat: 35.1796, lng: 129.0756 },
  { name: '부산 서부', lat: 35.0982, lng: 128.9666 },
  { name: '대구', lat: 35.8714, lng: 128.6014 },
  { name: '울산', lat: 35.5384, lng: 129.3114 },
  { name: '창원', lat: 35.2284, lng: 128.6811 },
  { name: '김해', lat: 35.2341, lng: 128.8810 },
  { name: '포항', lat: 36.0190, lng: 129.3435 },
  { name: '구미', lat: 36.1198, lng: 128.3446 },
  { name: '안동', lat: 36.5684, lng: 128.7294 },
  // 강원
  { name: '춘천', lat: 37.8813, lng: 127.7300 },
  { name: '원주', lat: 37.3422, lng: 127.9202 },
  { name: '강릉', lat: 37.7519, lng: 128.8761 },
  // 제주
  { name: '제주', lat: 33.4996, lng: 126.5312 },
  { name: '서귀포', lat: 33.2541, lng: 126.5600 },
];

const parseItems = (xmlText: string) => {
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
    const address = getValue(xml, 'dutyAddr');

    const dutyTimes: Record<string, string> = {};
    for (let i = 1; i <= 8; i++) {
      dutyTimes[`dutyTime${i}s`] = getValue(xml, `dutyTime${i}s`);
      dutyTimes[`dutyTime${i}c`] = getValue(xml, `dutyTime${i}c`);
    }

    // 주소에서 시도 추출
    const regionMatch = address.match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/);
    const region = regionMatch ? regionMatch[1] : '';

    items.push({
      hpid: hpid || null,
      name,
      address,
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
      is_night_pharmacy: checkIsNightPharmacy(dutyTimes),
      is_24h: checkIs24h(dutyTimes),
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

    // 특정 그리드 포인트만 처리할 수 있도록 파라미터 지원
    const url = new URL(req.url);
    const gridIndexStr = url.searchParams.get('gridIndex');
    let targetName: string | null = null;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        targetName = body.name || null;
      } catch { /* ignore */ }
    }

    let gridPoints = REGION_GRID;
    if (gridIndexStr) {
      const idx = parseInt(gridIndexStr, 10);
      if (idx >= 0 && idx < REGION_GRID.length) {
        gridPoints = [REGION_GRID[idx]];
      }
    }
    if (targetName) {
      const found = REGION_GRID.filter(g => g.name.includes(targetName!));
      if (found.length > 0) gridPoints = found;
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const seenHpids = new Set<string>();
    const gridResults: Record<string, { count: number; error?: string }> = {};

    for (const point of gridPoints) {
      try {
        console.log(`[sync-pharmacies] Fetching grid: ${point.name} (${point.lat}, ${point.lng})`);

        // serviceKey 직접 삽입으로 이중 인코딩 방지
        const apiUrl = `${API_BASE_URL}?serviceKey=${serviceKey}&WGS84_LAT=${point.lat}&WGS84_LON=${point.lng}&pageNo=1&numOfRows=1000`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          console.error(`[sync-pharmacies] API HTTP ${response.status} for ${point.name}`);
          gridResults[point.name] = { count: 0, error: `HTTP ${response.status}` };
          totalErrors++;
          continue;
        }

        const xmlText = await response.text();

        if (xmlText.includes('<errMsg>') || xmlText.includes('<cmmMsgHeader>')) {
          const errMsg = getValue(xmlText, 'errMsg') || getValue(xmlText, 'returnAuthMsg');
          console.error(`[sync-pharmacies] API error for ${point.name}: ${errMsg}`);
          gridResults[point.name] = { count: 0, error: errMsg };
          totalErrors++;
          continue;
        }

        const totalCount = parseInt(getValue(xmlText, 'totalCount'), 10) || 0;
        let allItems = parseItems(xmlText);

        // 결과가 1000개 이상이면 추가 페이지 호출
        if (totalCount > 1000) {
          const totalPages = Math.ceil(totalCount / 1000);
          for (let page = 2; page <= Math.min(totalPages, 5); page++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            const pageUrl = `${API_BASE_URL}?serviceKey=${serviceKey}&WGS84_LAT=${point.lat}&WGS84_LON=${point.lng}&pageNo=${page}&numOfRows=1000`;
            try {
              const pageResp = await fetch(pageUrl);
              if (pageResp.ok) {
                const pageXml = await pageResp.text();
                const pageItems = parseItems(pageXml);
                allItems = allItems.concat(pageItems);
                console.log(`[sync-pharmacies] ${point.name} page ${page}: ${pageItems.length} items`);
              }
            } catch (pageErr) {
              console.error(`[sync-pharmacies] Page ${page} error for ${point.name}:`, pageErr);
            }
          }
        }

        // 중복 제거 (hpid 기준)
        const uniqueItems = allItems.filter(item => {
          const hpid = item.hpid as string | null;
          if (!hpid) return true; // hpid 없는 건 일단 포함
          if (seenHpids.has(hpid)) return false;
          seenHpids.add(hpid);
          return true;
        });

        const newItems = uniqueItems.length;
        const skipped = allItems.length - uniqueItems.length;
        totalSkipped += skipped;

        console.log(`[sync-pharmacies] ${point.name}: ${totalCount} total, ${allItems.length} parsed, ${uniqueItems.length} unique, ${skipped} duplicates`);

        // DB upsert (배치)
        if (uniqueItems.length > 0) {
          const withHpid = uniqueItems.filter(item => item.hpid);
          const withoutHpid = uniqueItems.filter(item => !item.hpid);

          if (withHpid.length > 0) {
            const batchSize = 500;
            for (let i = 0; i < withHpid.length; i += batchSize) {
              const batch = withHpid.slice(i, i + batchSize);
              const { error: upsertError } = await supabase
                .from('pharmacies')
                .upsert(batch, { onConflict: 'hpid', ignoreDuplicates: false });

              if (upsertError) {
                console.error(`[sync-pharmacies] Upsert error for ${point.name}:`, upsertError);
                totalErrors++;
              } else {
                totalInserted += batch.length;
              }
            }
          }

          // hpid 없는 것은 개별 insert
          for (const item of withoutHpid) {
            const { data: existing } = await supabase
              .from('pharmacies')
              .select('id')
              .eq('name', item.name as string)
              .eq('lat', item.lat as number)
              .eq('lng', item.lng as number)
              .limit(1);

            if (existing && existing.length > 0) {
              await supabase.from('pharmacies').update(item).eq('id', existing[0].id);
            } else {
              const { error: insertErr } = await supabase.from('pharmacies').insert(item);
              if (!insertErr) totalInserted++;
            }
          }
        }

        gridResults[point.name] = { count: newItems };

        // API rate limit 방지
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (gridErr: unknown) {
        const errMsg = gridErr instanceof Error ? gridErr.message : String(gridErr);
        console.error(`[sync-pharmacies] Error for ${point.name}:`, gridErr);
        gridResults[point.name] = { count: 0, error: errMsg };
        totalErrors++;
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      totalInserted,
      totalSkipped,
      totalErrors,
      gridPointsProcessed: gridPoints.length,
      duration_ms: duration,
      grid: gridResults,
      timestamp: new Date().toISOString(),
    };

    console.log(`[sync-pharmacies] Complete: ${totalInserted} inserted, ${totalSkipped} skipped, ${totalErrors} errors in ${duration}ms`);

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[sync-pharmacies] Fatal error:', err);
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
