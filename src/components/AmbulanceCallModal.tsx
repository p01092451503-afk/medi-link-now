import { useState, useEffect, useCallback } from "react";
import * as Sentry from "@sentry/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ambulance, Phone, MapPin, Check, Clock, AlertCircle, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Hospital } from "@/data/hospitals";
import { cleanHospitalName } from "@/lib/utils";
import { useDispatchRequests } from "@/hooks/useDispatchRequests";
import { useSymptomAnalysis, SYMPTOM_CHIPS } from "@/hooks/useSymptomAnalysis";
import type { SymptomAnalysisResult } from "@/hooks/useSymptomAnalysis";

interface AmbulanceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital | null;
  distance?: number;
  userLocation?: [number, number] | null;
}

type CallState = "form" | "submitting" | "submitted" | "accepted";

const severityConfig = {
  critical: { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", label: "위급" },
  emergency: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-600 dark:text-orange-400", label: "응급" },
  "non-emergency": { bg: "bg-secondary", border: "border-border", text: "text-foreground", label: "비응급" },
};

const SymptomAnalysisResultCard = ({ result }: { result: SymptomAnalysisResult }) => {
  const config = severityConfig[result.severity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 border ${config.bg} ${config.border} space-y-3`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-foreground" />
          <span className="text-xs font-medium text-muted-foreground">AI 분석 결과</span>
        </div>
        <span className={`text-sm font-bold ${config.text}`}>
          중증도: {result.severityLabel}
        </span>
      </div>

      <div className="space-y-2">
        <div className={`text-sm font-semibold ${config.text}`}>
          {result.recommendation}
        </div>
        {result.severity === "critical" && (
          <button
            onClick={() => { window.location.href = "tel:119"; }}
            className="w-full py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            즉시 119 신고
          </button>
        )}
      </div>

      {result.specialties.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">추천 전문과</p>
          <div className="flex flex-wrap gap-1.5">
            {result.specialties.map((s) => (
              <span key={s} className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground border border-border">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-[11px] text-muted-foreground">
        KTAS {result.ktasLevel}등급 · {result.ktasReason}
      </div>
    </motion.div>
  );
};

const AmbulanceCallModal = ({ isOpen, onClose, hospital, distance, userLocation }: AmbulanceCallModalProps) => {
  const { createRequest, myRequests } = useDispatchRequests();
  const symptomAnalysis = useSymptomAnalysis();
  const [callState, setCallState] = useState<CallState>("form");
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patientName: "",
    pickupLocation: "",
    notes: "",
  });

  const estimatedCost = distance ? Math.round(50000 + distance * 5000) : 75000;
  const estimatedTime = distance ? Math.round(5 + distance * 2) : 10;

  useEffect(() => {
    if (!isOpen) {
      setCallState("form");
      setCreatedRequestId(null);
      setFormData({ patientName: "", pickupLocation: "", notes: "" });
      symptomAnalysis.reset();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!createdRequestId) return;
    const myReq = myRequests.find((r) => r.id === createdRequestId);
    if (myReq && myReq.status === "accepted") {
      setCallState("accepted");
    }
  }, [myRequests, createdRequestId]);

  const handleAnalyze = useCallback(async () => {
    await symptomAnalysis.analyze();
  }, [symptomAnalysis.analyze]);

  const handleSubmit = useCallback(async () => {
    if (!hospital) return;
    setCallState("submitting");

    const pickupLat = userLocation ? userLocation[0] : hospital.lat;
    const pickupLng = userLocation ? userLocation[1] : hospital.lng;

    const symptomLabels = symptomAnalysis.selectedSymptoms
      .map((id) => SYMPTOM_CHIPS.find((c) => c.id === id)?.label)
      .filter(Boolean);
    const conditionText = [
      ...symptomLabels,
      symptomAnalysis.additionalNote.trim() || null,
      symptomAnalysis.result ? `[KTAS ${symptomAnalysis.result.ktasLevel}등급]` : null,
    ].filter(Boolean).join(", ");

    const request = await createRequest({
      pickup_location: formData.pickupLocation || "현재 위치",
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      destination: cleanHospitalName(hospital.nameKr),
      destination_lat: hospital.lat,
      destination_lng: hospital.lng,
      patient_name: formData.patientName || undefined,
      patient_condition: conditionText || undefined,
      notes: formData.notes || undefined,
      estimated_distance_km: distance,
      estimated_fee: estimatedCost,
    });

    if (request) {
      setCreatedRequestId(request.id);
      setCallState("submitted");
    } else {
      Sentry.captureMessage("Ambulance dispatch failed", {
        level: "error",
        extra: { hospitalId: hospital?.id },
      });
      setCallState("form");
    }
  }, [hospital, userLocation, formData, distance, estimatedCost, createRequest, symptomAnalysis]);

  if (!hospital) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[2000]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-4 bottom-4 bg-background rounded-3xl shadow-2xl z-[2001] max-w-md mx-auto overflow-hidden flex flex-col sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:max-h-[calc(100dvh-2rem)]"
          >
            {/* Header */}
            <div className="relative bg-foreground p-6 text-background shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-background/10 hover:bg-background/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-background/10 flex items-center justify-center">
                  <Ambulance className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">사설 구급차 호출</h3>
                  <p className="text-sm opacity-60">Private Ambulance Service</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              {callState === "form" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Destination */}
                  <div className="bg-secondary rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">목적지</p>
                        <p className="font-semibold text-foreground">{cleanHospitalName(hospital.nameKr)}</p>
                        <p className="text-sm text-muted-foreground">{hospital.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cost Estimate */}
                  <div className="bg-secondary rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">예상 비용</span>
                      <span className="text-2xl font-bold text-foreground">₩{estimatedCost.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">예상 도착 시간</span>
                      <span className="font-medium text-foreground">약 {estimatedTime}분</span>
                    </div>
                  </div>

                  {/* Symptom Selection */}
                  <div>
                    <label className="text-xs font-medium text-foreground mb-2 block flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5" />
                      증상 선택 (AI 분석)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SYMPTOM_CHIPS.map((chip) => {
                        const selected = symptomAnalysis.selectedSymptoms.includes(chip.id);
                        return (
                          <button
                            key={chip.id}
                            onClick={() => symptomAnalysis.toggleSymptom(chip.id)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                              selected
                                ? "bg-foreground text-background border-foreground scale-[1.02]"
                                : "bg-secondary text-foreground border-border hover:border-foreground/30"
                            }`}
                          >
                            {chip.icon} {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Note */}
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">추가 증상 설명</label>
                    <Input
                      placeholder="예: 30대 남성, 10분 전부터 가슴 통증"
                      value={symptomAnalysis.additionalNote}
                      onChange={(e) => symptomAnalysis.setAdditionalNote(e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>

                  {/* Analyze Button */}
                  {(symptomAnalysis.selectedSymptoms.length > 0 || symptomAnalysis.additionalNote.trim()) && !symptomAnalysis.result && (
                    <Button
                      onClick={handleAnalyze}
                      disabled={symptomAnalysis.isAnalyzing}
                      variant="outline"
                      className="w-full py-5 rounded-2xl font-semibold"
                    >
                      {symptomAnalysis.isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          AI 분석 중...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          증상 분석하기
                        </>
                      )}
                    </Button>
                  )}

                  {/* Analysis Error */}
                  {symptomAnalysis.error && (
                    <p className="text-xs text-destructive text-center">{symptomAnalysis.error}</p>
                  )}

                  {/* Analysis Result */}
                  {symptomAnalysis.result && (
                    <SymptomAnalysisResultCard result={symptomAnalysis.result} />
                  )}

                  {/* Patient Info Form */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">환자 이름 (선택)</label>
                      <Input
                        placeholder="환자 이름"
                        value={formData.patientName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, patientName: e.target.value }))}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">픽업 위치</label>
                      <Input
                        placeholder="상세 주소 또는 랜드마크"
                        value={formData.pickupLocation}
                        onChange={(e) => setFormData((prev) => ({ ...prev, pickupLocation: e.target.value }))}
                        className="h-10 rounded-xl"
                      />
                      {userLocation && (
                        <p className="text-[10px] text-muted-foreground mt-1">현재 위치 감지됨</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">추가 메모 (선택)</label>
                      <Textarea
                        placeholder="구급대원에게 전달할 내용 (예: 아파트 동/호수)"
                        value={formData.notes}
                        onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-2 p-3 bg-secondary rounded-2xl">
                    <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      실제 비용은 거리 및 상황에 따라 달라질 수 있습니다.
                      <br />
                      <strong className="text-foreground">생명이 위급한 상황에서는 119에 먼저 신고하세요.</strong>
                    </p>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={handleSubmit}
                    className="w-full py-6 rounded-2xl text-base font-bold bg-foreground text-background hover:opacity-90"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    호출 요청 보내기
                  </Button>
                </motion.div>
              )}

              {callState === "submitting" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-secondary" />
                    <div className="absolute inset-0 rounded-full border-4 border-foreground border-t-transparent animate-spin" />
                    <Ambulance className="absolute inset-0 m-auto w-8 h-8 text-foreground" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">호출 요청을 보내는 중...</h4>
                  <p className="text-sm text-muted-foreground">잠시만 기다려 주세요</p>
                </motion.div>
              )}

              {callState === "submitted" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-5">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">호출 요청이 접수되었습니다!</h4>
                    <p className="text-sm text-muted-foreground">
                      가까운 구급대원에게 알림을 보냈습니다.<br />수락되면 실시간으로 안내해드립니다.
                    </p>
                  </div>
                  <div className="bg-secondary rounded-2xl p-4 text-left">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">목적지</p>
                        <p className="font-semibold text-foreground text-sm">{cleanHospitalName(hospital.nameKr)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="text-muted-foreground">예상 비용</span>
                      <span className="font-bold text-foreground">₩{estimatedCost.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-xs ml-2">구급대원 응답 대기 중</span>
                  </div>
                  <Button onClick={onClose} variant="outline" className="w-full py-4 rounded-2xl">
                    닫기 (상태는 알림으로 확인)
                  </Button>
                </motion.div>
              )}

              {callState === "accepted" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                      <Ambulance className="w-10 h-10 text-foreground animate-pulse" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-1">구급차가 출발했습니다!</h4>
                    <p className="text-sm text-muted-foreground">곧 도착할 예정입니다</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-foreground font-semibold">
                    <Clock className="w-5 h-5" />
                    <span>예상 도착: {estimatedTime}분</span>
                  </div>
                  <Button onClick={onClose} variant="outline" className="w-full py-4 rounded-2xl">닫기</Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AmbulanceCallModal;
