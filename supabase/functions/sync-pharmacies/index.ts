import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 건강보험심사평가원 약국정보서비스 API (B551182)
const API_BASE_URL = "https://apis.data.go.kr/B551182/pharmacyInfoService/getParmacyBasisList";

// 전국 17개 시도 코드
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

const getValue = (xml: string, tag: string): string => {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const result = regex.exec(xml);
  return result ? result[1].trim() : '';
};

const getFloatValue = (xml: string, tag: string): number => {
  const val = getValue(xml, tag);
  return val ? parseFloat(val) || 0 : 0;
};

const parseItems = (xmlText: string, region: string) => {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const items: Record<string, unknown>[] = [];
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const xml = match[1];

    // HIRA API: XPos = 경도(lng), YPos = 위도(lat)
    const lng = getFloatValue(xml, 'XPos');
    const lat = getFloatValue(xml, 'YPos');
    if (!lat || !lng) continue;

    const name = getValue(xml, 'yadmNm');
    if (!name) continue;

    const ykiho = getValue(xml, 'ykiho');
    const address = getValue(xml, 'addr');

    items.push({
      hpid: ykiho || null,
      name,
      address,
      phone: getValue(xml, 'telno'),
      lat,
      lng,
      region,
      // HIRA 기본 목록 API에는 영업시간 정보가 없음
      // duty_time 컬럼은 null 유지
      is_night_pharmacy: false,
      is_24h: false,
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

    // 특정 시도만 처리 가능 (파라미터)
    let targetSidoCd: string | null = null;
    let targetRegion: string | null = null;

    const url = new URL(req.url);
    targetSidoCd = url.searchParams.get('sidoCd');
    targetRegion = url.searchParams.get('region');

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        targetSidoCd = body.sidoCd || targetSidoCd;
        targetRegion = body.region || targetRegion;
      } catch { /* ignore */ }
    }

    // 대상 시도 결정
    let targetSidos = SIDO_CODES;
    if (targetSidoCd) {
      const found = SIDO_CODES.filter(s => s.code === targetSidoCd);
      if (found.length > 0) targetSidos = found;
    }
    if (targetRegion) {
      const found = SIDO_CODES.filter(s => s.region === targetRegion || s.name.includes(targetRegion!));
      if (found.length > 0) targetSidos = found;
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const seenIds = new Set<string>();
    const sidoResults: Record<string, { count: number; pages: number; error?: string }> = {};

    for (const sido of targetSidos) {
      try {
        console.log(`[sync-pharmacies] Fetching: ${sido.name} (sidoCd=${sido.code})`);

        // 1페이지 조회 (총 건수 확인)
        const firstUrl = `${API_BASE_URL}?serviceKey=${serviceKey}&sidoCd=${sido.code}&pageNo=1&numOfRows=1000`;
        const firstResp = await fetch(firstUrl);

        if (!firstResp.ok) {
          const statusText = await firstResp.text();
          console.error(`[sync-pharmacies] HTTP ${firstResp.status} for ${sido.name}: ${statusText.substring(0, 200)}`);
          sidoResults[sido.name] = { count: 0, pages: 0, error: `HTTP ${firstResp.status}` };
          totalErrors++;
          continue;
        }

        const firstXml = await firstResp.text();

        // 에러 응답 체크
        if (firstXml.includes('<errMsg>') || firstXml.includes('<cmmMsgHeader>')) {
          const errMsg = getValue(firstXml, 'errMsg') || getValue(firstXml, 'returnAuthMsg') || getValue(firstXml, 'returnReasonCode');
          console.error(`[sync-pharmacies] API error for ${sido.name}: ${errMsg}`);
          sidoResults[sido.name] = { count: 0, pages: 0, error: errMsg };
          totalErrors++;
          continue;
        }

        const totalCount = parseInt(getValue(firstXml, 'totalCount'), 10) || 0;
        let allItems = parseItems(firstXml, sido.region);
        const totalPages = Math.ceil(totalCount / 1000);

        console.log(`[sync-pharmacies] ${sido.name}: totalCount=${totalCount}, page 1 parsed=${allItems.length}, totalPages=${totalPages}`);

        // 나머지 페이지 호출 (최대 20페이지 = 20,000건)
        for (let page = 2; page <= Math.min(totalPages, 20); page++) {
          await new Promise(resolve => setTimeout(resolve, 200)); // rate limit

          const pageUrl = `${API_BASE_URL}?serviceKey=${serviceKey}&sidoCd=${sido.code}&pageNo=${page}&numOfRows=1000`;
          try {
            const pageResp = await fetch(pageUrl);
            if (pageResp.ok) {
              const pageXml = await pageResp.text();
              const pageItems = parseItems(pageXml, sido.region);
              allItems = allItems.concat(pageItems);
              console.log(`[sync-pharmacies] ${sido.name} page ${page}/${totalPages}: +${pageItems.length}`);
            } else {
              const errText = await pageResp.text();
              console.error(`[sync-pharmacies] Page ${page} HTTP ${pageResp.status} for ${sido.name}: ${errText.substring(0, 100)}`);
            }
          } catch (pageErr) {
            console.error(`[sync-pharmacies] Page ${page} error for ${sido.name}:`, pageErr);
          }
        }

        // 중복 제거 (ykiho/hpid 기준)
        const uniqueItems = allItems.filter(item => {
          const hpid = item.hpid as string | null;
          if (!hpid) return true;
          if (seenIds.has(hpid)) return false;
          seenIds.add(hpid);
          return true;
        });

        const skipped = allItems.length - uniqueItems.length;
        totalSkipped += skipped;

        console.log(`[sync-pharmacies] ${sido.name}: ${allItems.length} parsed, ${uniqueItems.length} unique, ${skipped} duplicates`);

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
                console.error(`[sync-pharmacies] Upsert error for ${sido.name} batch ${Math.floor(i / batchSize) + 1}:`, upsertError);
                totalErrors++;
              } else {
                totalInserted += batch.length;
              }
            }
          }

          // hpid 없는 것은 name+lat+lng 기준 중복 체크 후 삽입
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

        sidoResults[sido.name] = { count: uniqueItems.length, pages: Math.min(totalPages, 20) };

        // API rate limit 방지
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (sidoErr: unknown) {
        const errMsg = sidoErr instanceof Error ? sidoErr.message : String(sidoErr);
        console.error(`[sync-pharmacies] Error for ${sido.name}:`, sidoErr);
        sidoResults[sido.name] = { count: 0, pages: 0, error: errMsg };
        totalErrors++;
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      api: 'B551182/pharmacyInfoService (HIRA)',
      totalInserted,
      totalSkipped,
      totalErrors,
      sidoCount: targetSidos.length,
      duration_ms: duration,
      results: sidoResults,
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
