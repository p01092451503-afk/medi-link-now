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

const systemPrompt = `당신은 한국 응급의료 시스템을 위한 환자 정보 파싱 AI입니다.
사용자가 음성으로 말한 환자 정보 텍스트를 분석하여 구조화된 데이터로 변환해야 합니다.

다음 필드를 추출해주세요:
- gender: "M" (남자/남성) 또는 "F" (여자/여성)
- age: 숫자 또는 "50대" 형식 (나이)
- chiefComplaint: 주 호소 증상 (아래 목록 중 가장 적절한 것 선택)
  - "흉통 (Chest Pain)"
  - "호흡곤란 (Dyspnea)"
  - "복통 (Abdominal Pain)"
  - "두통 (Headache)"
  - "의식변화 (Mental Status Change)"
  - "외상 (Trauma)"
  - "발열 (Fever)"
  - "어지러움 (Dizziness)"
  - "심정지 (Cardiac Arrest)"
  - "경련 (Seizure)"
  - "기타 (Other)"
- bloodPressure: 혈압 (예: "140/90")
- pulse: 맥박/심박수 (숫자만)
- spo2: 산소포화도 (숫자만)
- symptoms: 감지된 증상 키워드 배열 (예: ["흉통", "호흡곤란"])
- ktasLevel: KTAS 등급 (1-5 숫자만, 아래 기준에 따라 결정)
- ktasReason: KTAS 등급 결정 이유

KTAS 등급 결정 기준:
- 1등급 (소생): 심정지, 무호흡, 심폐소생술, CPR, 맥박 없음, 호흡 없음
- 2등급 (긴급): 의식 없음, 의식불명, 대량출혈, 경련, 발작, 마비, 뇌졸중 의심
- 3등급 (응급): 흉통, 호흡곤란, 심한 복통, 고열(39도 이상), 중등도 외상
- 4등급 (준응급): 경미한 외상, 단순 복통, 단순 두통, 경미한 발열
- 5등급 (비응급): 가벼운 증상, 만성 질환 관련

예시 입력: "50대 남성, 흉통 호소, 혈압 130에 80, 맥박 100"
예시 출력: {"gender":"M","age":"50대","chiefComplaint":"흉통 (Chest Pain)","bloodPressure":"130/80","pulse":"100","spo2":null,"symptoms":["흉통"],"ktasLevel":"3","ktasReason":"흉통 증상으로 응급 처치 필요"}

JSON 형식으로만 응답하세요. 추가 설명 없이 JSON만 출력하세요.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { transcript } = await req.json();
    
    if (!transcript || typeof transcript !== "string") {
      return new Response(
        JSON.stringify({ error: "transcript is required" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("Parsing transcript:", transcript);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 서비스 크레딧이 부족합니다." }),
          { status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    console.log("AI response content:", content);

    // Try to parse the JSON response
    let parsedData;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      parsedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(
        JSON.stringify({ error: "AI 응답을 파싱할 수 없습니다", rawContent: content }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Construct ageGender field
    if (parsedData.age || parsedData.gender) {
      parsedData.ageGender = `${parsedData.gender || ""}/${parsedData.age || ""}`;
    }

    console.log("Parsed patient data:", parsedData);

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in parse-patient-info:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
