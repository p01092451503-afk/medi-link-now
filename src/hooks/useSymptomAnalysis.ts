import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SymptomAnalysisResult {
  severity: "critical" | "emergency" | "non-emergency";
  severityLabel: string;
  recommendation: string;
  specialties: string[];
  ktasLevel: string;
  ktasReason: string;
  suggestedFilter: string | null;
}

export const SYMPTOM_CHIPS = [
  { id: "unconscious", label: "의식 없음", icon: "🧠" },
  { id: "dyspnea", label: "호흡 곤란", icon: "🫁" },
  { id: "chest_pain", label: "흉통", icon: "❤️" },
  { id: "bleeding", label: "출혈", icon: "🩸" },
  { id: "fracture", label: "골절 의심", icon: "🦴" },
  { id: "stroke", label: "뇌졸중 의심", icon: "🧠" },
  { id: "shock", label: "쇼크", icon: "⚡" },
  { id: "other", label: "기타", icon: "📋" },
] as const;

export type SymptomId = (typeof SYMPTOM_CHIPS)[number]["id"];

export function useSymptomAnalysis() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomId[]>([]);
  const [additionalNote, setAdditionalNote] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SymptomAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSymptom = useCallback((id: SymptomId) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setResult(null);
  }, []);

  const analyze = useCallback(async () => {
    if (selectedSymptoms.length === 0 && !additionalNote.trim()) {
      setError("증상을 선택하거나 추가 정보를 입력해주세요.");
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const symptomLabels = selectedSymptoms
        .map((id) => SYMPTOM_CHIPS.find((c) => c.id === id)?.label)
        .filter(Boolean);

      const transcript = [
        ...symptomLabels,
        additionalNote.trim() ? additionalNote.trim() : null,
      ]
        .filter(Boolean)
        .join(", ");

      const { data, error: fnError } = await supabase.functions.invoke(
        "parse-patient-info",
        { body: { transcript } }
      );

      if (fnError) throw fnError;

      if (data?.error) {
        setError(data.error);
        return null;
      }

      const parsed = data?.data;
      if (!parsed) {
        setError("분석 결과를 받지 못했습니다.");
        return null;
      }

      // Map KTAS to severity
      const ktasLevel = parseInt(parsed.ktasLevel || "4", 10);
      let severity: SymptomAnalysisResult["severity"];
      let severityLabel: string;
      let recommendation: string;

      if (ktasLevel <= 2) {
        severity = "critical";
        severityLabel = "위급";
        recommendation = "즉시 119 연계 권고";
      } else if (ktasLevel === 3) {
        severity = "emergency";
        severityLabel = "응급";
        recommendation = "119 연계 또는 사설 구급차 이용 가능";
      } else {
        severity = "non-emergency";
        severityLabel = "비응급";
        recommendation = "사설 구급차 이용 가능";
      }

      // Determine specialties from chiefComplaint
      const specialties: string[] = [];
      const cc = (parsed.chiefComplaint || "").toLowerCase();
      if (cc.includes("chest") || cc.includes("흉통")) specialties.push("심장내과");
      if (cc.includes("mental") || cc.includes("의식")) specialties.push("신경외과", "응급의학과");
      if (cc.includes("dyspnea") || cc.includes("호흡")) specialties.push("호흡기내과");
      if (cc.includes("trauma") || cc.includes("외상")) specialties.push("정형외과", "외과");
      if (cc.includes("headache") || cc.includes("두통")) specialties.push("신경과");
      if (cc.includes("seizure") || cc.includes("경련")) specialties.push("신경과");
      if (cc.includes("cardiac") || cc.includes("심정지")) specialties.push("심장내과", "응급의학과");
      if (specialties.length === 0) specialties.push("응급의학과");

      // Determine hospital filter suggestion
      let suggestedFilter: string | null = null;
      if (cc.includes("chest") || cc.includes("흉통") || cc.includes("cardiac") || cc.includes("심정지"))
        suggestedFilter = "cardio";
      else if (cc.includes("trauma") || cc.includes("외상"))
        suggestedFilter = "trauma";
      else if (cc.includes("headache") || cc.includes("두통") || cc.includes("mental") || cc.includes("의식"))
        suggestedFilter = "neuro";

      const analysisResult: SymptomAnalysisResult = {
        severity,
        severityLabel,
        recommendation,
        specialties: [...new Set(specialties)],
        ktasLevel: parsed.ktasLevel || "4",
        ktasReason: parsed.ktasReason || "",
        suggestedFilter,
      };

      setResult(analysisResult);
      return analysisResult;
    } catch (err: any) {
      console.error("Symptom analysis error:", err);
      setError(err?.message || "분석 중 오류가 발생했습니다.");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedSymptoms, additionalNote]);

  const reset = useCallback(() => {
    setSelectedSymptoms([]);
    setAdditionalNote("");
    setResult(null);
    setError(null);
  }, []);

  return {
    selectedSymptoms,
    additionalNote,
    setAdditionalNote,
    toggleSymptom,
    isAnalyzing,
    result,
    error,
    analyze,
    reset,
  };
}
