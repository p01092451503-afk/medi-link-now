// @deno-std v0.224.0 — updated 2026-03
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// 1차: B551182 (HIRA 기본 목록 - sidoCd 지원, 영업시간 없음)
const HIRA_API_URL = "http://apis.data.go.kr/B551182/pharmacyInfoService/getParmacyBasisList";

// 2차: B552657 (국립중앙의료원 - 영업시간 포함)
const NMC_API_URL = "http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire";

// 전국 17개 시도 코드 (B551182용)
const SIDO_CODES: { code: string; name: string; region: string }[] = [
  { code: '110000', name: '서울특별시', region: '서울' },
  { code: '210000', name: '부산광역시', region: '부산' },
  { code: '220000', name: '대구광역시', region: '대구' },
  { code: '230000', name: '인천광역시', region: '인천' },
  { code: '240000', name: '광주광역시', region: '광주' },
  { code: '250000', name: '대전광역시', region: '대전' },
  { code: '260000', name: '울산광역시', region: '울산' },
  { code: '290000', name: '세종특별자치시', region: '세종' },
  { code: '310000', name: '경기도', region: '경기' },
  { code: '320000', name: '강원특별자치도', region: '강원' },
  { code: '330000', name: '충청북도', region: '충북' },
  { code: '340000', name: '충청남도', region: '충남' },
  { code: '350000', name: '전북특별자치도', region: '전북' },
  { code: '360000', name: '전라남도', region: '전남' },
  { code: '370000', name: '경상북도', region: '경북' },
  { code: '380000', name: '경상남도', region: '경남' },
  { code: '390000', name: '제주특별자치도', region: '제주' },
];

// 지역별 Q0 파라미터 (B552657용)
const REGION_QUERIES: Record<string, string> = {
  '서울': '서울', '부산': '부산', '대구': '대구', '인천': '인천',
  '광주': '광주광역시', '대전': '대전', '울산': '울산', '세종': '세종',
  '경기': '경기', '강원': '강원', '충북': '충청북도', '충남': '충청남도',
  '전북': '전북', '전남': '전라남도', '경북': '경상북도', '경남': '경상남도', '제주': '제주',
};

const getValue = (xml: string, tag: string): string => {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const result = regex.exec(xml);
  return result ? result[1].trim() : '';
};

const getFloatValue = (xml: string, tag: string): number => {
  const val = getValue(xml, tag);
  return val ? parseFloat(val) || 0 : 0;
};

// B551182 API에서 기본 정보 파싱
const parseHiraItems = (xmlText: string, region: string) => {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const items: Record<string, unknown>[] = [];
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const xml = match[1];
    const lng = getFloatValue(xml, 'XPos');
    const lat = getFloatValue(xml, 'YPos');
    if (!lat || !lng) continue;

    const name = getValue(xml, 'yadmNm');
    if (!name) continue;

    items.push({
      hpid: getValue(xml, 'ykiho') || null,
      name,
      address: getValue(xml, 'addr'),
      phone: getValue(xml, 'telno'),
      lat,
      lng,
      region,
      is_night_pharmacy: false,
      is_24h: false,
    });
  }
  return items;
};

// B552657 API에서 영업시간 포함 정보 파싱
const parseNmcItems = (xmlText: string, region: string) => {
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

    const dutyTime1s = getValue(xml, 'dutyTime1s') || null;
    const dutyTime1c = getValue(xml, 'dutyTime1c') || null;
    const dutyTime2s = getValue(xml, 'dutyTime2s') || null;
    const dutyTime2c = getValue(xml, 'dutyTime2c') || null;
    const dutyTime3s = getValue(xml, 'dutyTime3s') || null;
    const dutyTime3c = getValue(xml, 'dutyTime3c') || null;
    const dutyTime4s = getValue(xml, 'dutyTime4s') || null;
    const dutyTime4c = getValue(xml, 'dutyTime4c') || null;
    const dutyTime5s = getValue(xml, 'dutyTime5s') || null;
    const dutyTime5c = getValue(xml, 'dutyTime5c') || null;
    const dutyTime6s = getValue(xml, 'dutyTime6s') || null;
    const dutyTime6c = getValue(xml, 'dutyTime6c') || null;
    const dutyTime7s = getValue(xml, 'dutyTime7s') || null;
    const dutyTime7c = getValue(xml, 'dutyTime7c') || null;
    const dutyTime8s = getValue(xml, 'dutyTime8s') || null;
    const dutyTime8c = getValue(xml, 'dutyTime8c') || null;

    // 심야 약국 판별
    let isNight = false;
    const weekdayCloseVals = [dutyTime1c, dutyTime2c, dutyTime3c, dutyTime4c, dutyTime5c];
    for (const val of weekdayCloseVals) {
      if (val) {
        const t = parseInt(val, 10);
        if (t >= 2200 || (t > 0 && t < 400)) { isNight = true; break; }
      }
    }

    // 24시간 판별
    const is24h = dutyTime1s && dutyTime1c &&
      parseInt(dutyTime1s, 10) === 0 && (parseInt(dutyTime1c, 10) === 2400 || parseInt(dutyTime1c, 10) === 0);

    items.push({
      hpid: getValue(xml, 'hpid') || null,
      name,
      address: getValue(xml, 'dutyAddr'),
      phone: getValue(xml, 'dutyTel1'),
      lat,
      lng,
      region,
      duty_time_1s: dutyTime1s,
      duty_time_1c: dutyTime1c,
      duty_time_2s: dutyTime2s,
      duty_time_2c: dutyTime2c,
      duty_time_3s: dutyTime3s,
      duty_time_3c: dutyTime3c,
      duty_time_4s: dutyTime4s,
      duty_time_4c: dutyTime4c,
      duty_time_5s: dutyTime5s,
      duty_time_5c: dutyTime5c,
      duty_time_6s: dutyTime6s,
      duty_time_6c: dutyTime6c,
      duty_time_7s: dutyTime7s,
      duty_time_7c: dutyTime7c,
      duty_time_8s: dutyTime8s,
      duty_time_8c: dutyTime8c,
      is_night_pharmacy: isNight,
      is_24h: !!is24h,
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

    let targetRegion: string | null = null;
    const url = new URL(req.url);
    targetRegion = url.searchParams.get('region');

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        targetRegion = body.region || targetRegion;
      } catch { /* ignore */ }
    }

    // 대상 시도 결정
    let targetSidos = SIDO_CODES;
    if (targetRegion) {
      const found = SIDO_CODES.filter(s => s.region === targetRegion || s.name.includes(targetRegion!));
      if (found.length > 0) targetSidos = found;
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalWithHours = 0;
    let nmcAvailable = true;
    const seenIds = new Set<string>();
    const sidoResults: Record<string, { count: number; pages: number; withHours: number; source: string; error?: string }> = {};

    // B552657 사용 가능 여부 사전 체크
    let nmcCheckDetail = '';
    try {
      const testUrl = `${NMC_API_URL}?ServiceKey=${serviceKey}&pageNo=1&numOfRows=1`;
      console.log(`[sync-pharmacies] B552657 pre-check: key length=${serviceKey.length}`);
      const testResp = await fetch(testUrl);
      console.log(`[sync-pharmacies] B552657 pre-check status: ${testResp.status}`);
      
      if (testResp.status === 403 || testResp.status === 401) {
        nmcAvailable = false;
        const body = await testResp.text();
        nmcCheckDetail = `HTTP ${testResp.status}: ${body.substring(0, 300)}`;
        console.log(`[sync-pharmacies] B552657 API not available: ${nmcCheckDetail}`);
      } else {
        const testXml = await testResp.text();
        if (testXml.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR') || testXml.includes('APPLICATION_ERROR')) {
          nmcAvailable = false;
          const errDetail = getValue(testXml, 'returnAuthMsg') || getValue(testXml, 'errMsg') || 'KEY_NOT_REGISTERED';
          nmcCheckDetail = errDetail;
          console.log(`[sync-pharmacies] B552657 API key error: ${errDetail}`);
        } else {
          const totalCount = getValue(testXml, 'totalCount');
          console.log(`[sync-pharmacies] B552657 API available! totalCount=${totalCount}`);
          nmcCheckDetail = `OK (totalCount=${totalCount})`;
        }
      }
    } catch (checkErr) {
      nmcAvailable = false;
      nmcCheckDetail = `Exception: ${checkErr instanceof Error ? checkErr.message : String(checkErr)}`;
      console.log(`[sync-pharmacies] B552657 API check failed: ${nmcCheckDetail}`);
    }

    for (const sido of targetSidos) {
      try {
        console.log(`[sync-pharmacies] Fetching: ${sido.name}`);

        let allItems: Record<string, unknown>[] = [];
        let source = 'hira';

        // === 1차 시도: B552657 (영업시간 포함) ===
        if (nmcAvailable) {
          const q0 = REGION_QUERIES[sido.region] || sido.region;
          const nmcUrl = `${NMC_API_URL}?ServiceKey=${serviceKey}&Q0=${encodeURIComponent(q0)}&pageNo=1&numOfRows=1000`;

          try {
            const nmcResp = await fetch(nmcUrl);
            if (nmcResp.ok) {
              const nmcXml = await nmcResp.text();
              if (!nmcXml.includes('<errMsg>') && !nmcXml.includes('<cmmMsgHeader>')) {
                const totalCount = parseInt(getValue(nmcXml, 'totalCount'), 10) || 0;
                allItems = parseNmcItems(nmcXml, sido.region);
                const totalPages = Math.ceil(totalCount / 1000);

                for (let page = 2; page <= Math.min(totalPages, 20); page++) {
                  await new Promise(resolve => setTimeout(resolve, 250));
                  const pageUrl = `${NMC_API_URL}?ServiceKey=${serviceKey}&Q0=${encodeURIComponent(q0)}&pageNo=${page}&numOfRows=1000`;
                  try {
                    const pageResp = await fetch(pageUrl);
                    if (pageResp.ok) {
                      const pageXml = await pageResp.text();
                      allItems = allItems.concat(parseNmcItems(pageXml, sido.region));
                    }
                  } catch (e) {
                    console.error(`[sync-pharmacies] NMC page ${page} error:`, e);
                  }
                }

                if (allItems.length > 0) {
                  source = 'nmc';
                  console.log(`[sync-pharmacies] ${sido.name}: ${allItems.length} from B552657 (with hours)`);
                }
              }
            }
          } catch (nmcErr) {
            console.log(`[sync-pharmacies] B552657 failed for ${sido.name}, falling back to B551182`);
          }
        }

        // === 2차 폴백: B551182 (기본 정보만) ===
        if (allItems.length === 0) {
          const hiraUrl = `${HIRA_API_URL}?ServiceKey=${serviceKey}&sidoCd=${sido.code}&pageNo=1&numOfRows=1000`;
          const hiraResp = await fetch(hiraUrl);

          if (!hiraResp.ok) {
            const statusText = await hiraResp.text();
            console.error(`[sync-pharmacies] HTTP ${hiraResp.status} for ${sido.name}: ${statusText.substring(0, 500)}`);
            sidoResults[sido.name] = { count: 0, pages: 0, withHours: 0, source: 'error', error: `HTTP ${hiraResp.status}` };
            totalErrors++;
            continue;
          }

          const hiraXml = await hiraResp.text();

          if (hiraXml.includes('<errMsg>') || hiraXml.includes('<cmmMsgHeader>')) {
            const errMsg = getValue(hiraXml, 'errMsg') || getValue(hiraXml, 'returnAuthMsg');
            console.error(`[sync-pharmacies] API error for ${sido.name}: ${errMsg}`);
            sidoResults[sido.name] = { count: 0, pages: 0, withHours: 0, source: 'error', error: errMsg };
            totalErrors++;
            continue;
          }

          const totalCount = parseInt(getValue(hiraXml, 'totalCount'), 10) || 0;
          allItems = parseHiraItems(hiraXml, sido.region);
          const totalPages = Math.ceil(totalCount / 1000);

          for (let page = 2; page <= Math.min(totalPages, 20); page++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            const pageUrl = `${HIRA_API_URL}?ServiceKey=${serviceKey}&sidoCd=${sido.code}&pageNo=${page}&numOfRows=1000`;
            try {
              const pageResp = await fetch(pageUrl);
              if (pageResp.ok) {
                const pageXml = await pageResp.text();
                allItems = allItems.concat(parseHiraItems(pageXml, sido.region));
              }
            } catch (e) {
              console.error(`[sync-pharmacies] HIRA page ${page} error:`, e);
            }
          }

          source = 'hira';
          console.log(`[sync-pharmacies] ${sido.name}: ${allItems.length} from B551182 (no hours)`);
        }

        // 중복 제거
        const uniqueItems = allItems.filter(item => {
          const hpid = item.hpid as string | null;
          if (!hpid) return true;
          if (seenIds.has(hpid)) return false;
          seenIds.add(hpid);
          return true;
        });

        const skipped = allItems.length - uniqueItems.length;
        totalSkipped += skipped;

        const withHours = uniqueItems.filter(item => item.duty_time_1s !== null && item.duty_time_1s !== undefined).length;
        totalWithHours += withHours;

        // DB upsert
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
                console.error(`[sync-pharmacies] Upsert error for ${sido.name}:`, upsertError);
                totalErrors++;
              } else {
                totalInserted += batch.length;
              }
            }
          }

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

        sidoResults[sido.name] = { count: uniqueItems.length, pages: 1, withHours, source };

        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (sidoErr: unknown) {
        const errMsg = sidoErr instanceof Error ? sidoErr.message : String(sidoErr);
        console.error(`[sync-pharmacies] Error for ${sido.name}:`, sidoErr);
        sidoResults[sido.name] = { count: 0, pages: 0, withHours: 0, source: 'error', error: errMsg };
        totalErrors++;
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      api: nmcAvailable ? 'B552657 (국립중앙의료원) + B551182 (HIRA) fallback' : 'B551182 (HIRA) only',
      nmcCheckDetail,
      note: nmcAvailable
        ? '영업시간(dutyTime) 포함 API 사용'
        : '⚠️ B552657 API 활용 신청이 필요합니다. data.go.kr에서 "국립중앙의료원_전국 약국 정보 조회 서비스"를 검색하여 활용 신청해주세요.',
      totalInserted,
      totalSkipped,
      totalWithHours,
      totalErrors,
      sidoCount: targetSidos.length,
      duration_ms: duration,
      results: sidoResults,
      timestamp: new Date().toISOString(),
    };

    console.log(`[sync-pharmacies] Complete: ${totalInserted} inserted (${totalWithHours} with hours), ${totalSkipped} skipped, ${totalErrors} errors in ${duration}ms`);

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
