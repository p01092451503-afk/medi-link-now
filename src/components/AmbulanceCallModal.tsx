import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ambulance, Phone, MapPin, Check, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Hospital } from "@/data/hospitals";
import { cleanHospitalName } from "@/lib/utils";
import { useDispatchRequests, DispatchRequest } from "@/hooks/useDispatchRequests";

interface AmbulanceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital | null;
  distance?: number;
  userLocation?: [number, number] | null;
}

type CallState = "form" | "submitting" | "submitted" | "accepted";

const AmbulanceCallModal = ({ isOpen, onClose, hospital, distance, userLocation }: AmbulanceCallModalProps) => {
  const { createRequest, myRequests } = useDispatchRequests();
  const [callState, setCallState] = useState<CallState>("form");
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patientName: "",
    patientCondition: "",
    pickupLocation: "",
    notes: "",
  });

  const estimatedCost = distance ? Math.round(50000 + distance * 5000) : 75000;
  const estimatedTime = distance ? Math.round(5 + distance * 2) : 10;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCallState("form");
      setCreatedRequestId(null);
      setFormData({
        patientName: "",
        patientCondition: "",
        pickupLocation: "",
        notes: "",
      });
    }
  }, [isOpen]);

  // Watch for request status changes (driver accepted)
  useEffect(() => {
    if (!createdRequestId) return;
    const myReq = myRequests.find((r) => r.id === createdRequestId);
    if (myReq && myReq.status === "accepted") {
      setCallState("accepted");
    }
  }, [myRequests, createdRequestId]);

  const handleSubmit = useCallback(async () => {
    if (!hospital) return;

    setCallState("submitting");

    const pickupLat = userLocation ? userLocation[0] : hospital.lat;
    const pickupLng = userLocation ? userLocation[1] : hospital.lng;

    const request = await createRequest({
      pickup_location: formData.pickupLocation || "현재 위치",
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      destination: cleanHospitalName(hospital.nameKr),
      destination_lat: hospital.lat,
      destination_lng: hospital.lng,
      patient_name: formData.patientName || undefined,
      patient_condition: formData.patientCondition || undefined,
      notes: formData.notes || undefined,
      estimated_distance_km: distance,
      estimated_fee: estimatedCost,
    });

    if (request) {
      setCreatedRequestId(request.id);
      setCallState("submitted");
    } else {
      setCallState("form");
    }
  }, [hospital, userLocation, formData, distance, estimatedCost, createRequest]);

  if (!hospital) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[2000]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-4 bottom-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-[2001] max-w-md mx-auto overflow-hidden flex flex-col sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:max-h-[calc(100dvh-2rem)]"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Ambulance className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">사설 구급차 호출</h3>
                  <p className="text-sm opacity-80">Private Ambulance Service</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              {callState === "form" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Destination */}
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">목적지</p>
                        <p className="font-semibold text-foreground">{cleanHospitalName(hospital.nameKr)}</p>
                        <p className="text-sm text-muted-foreground">{hospital.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cost Estimate */}
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">예상 비용</span>
                      <span className="text-2xl font-bold text-primary">
                        ₩{estimatedCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">예상 도착 시간</span>
                      <span className="font-medium text-foreground">약 {estimatedTime}분</span>
                    </div>
                  </div>

                  {/* Patient Info Form */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">
                        환자 이름 (선택)
                      </label>
                      <Input
                        placeholder="환자 이름"
                        value={formData.patientName}
                        onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">
                        환자 상태 (선택)
                      </label>
                      <Input
                        placeholder="예: 가슴 통증, 호흡 곤란"
                        value={formData.patientCondition}
                        onChange={(e) => setFormData(prev => ({ ...prev, patientCondition: e.target.value }))}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">
                        픽업 위치
                      </label>
                      <Input
                        placeholder="상세 주소 또는 랜드마크"
                        value={formData.pickupLocation}
                        onChange={(e) => setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))}
                        className="h-10"
                      />
                      {userLocation && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          📍 현재 위치 감지됨
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">
                        추가 메모 (선택)
                      </label>
                      <Textarea
                        placeholder="구급대원에게 전달할 내용 (예: 아파트 동/호수)"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      실제 비용은 거리 및 상황에 따라 달라질 수 있습니다.
                      <br />
                      <strong>생명이 위급한 상황에서는 119에 먼저 신고하세요.</strong>
                    </p>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={handleSubmit}
                    className="w-full py-6 rounded-xl text-base font-semibold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    호출 요청 보내기
                  </Button>
                </motion.div>
              )}

              {callState === "submitting" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <Ambulance className="absolute inset-0 m-auto w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    호출 요청을 보내는 중...
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    잠시만 기다려 주세요
                  </p>
                </motion.div>
              )}

              {callState === "submitted" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-5"
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">
                      호출 요청이 접수되었습니다!
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      가까운 구급대원에게 알림을 보냈습니다.
                      <br />
                      수락되면 실시간으로 안내해드립니다.
                    </p>
                  </div>

                  {/* Destination Summary */}
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 text-left">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">목적지</p>
                        <p className="font-semibold text-foreground text-sm">{cleanHospitalName(hospital.nameKr)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="text-muted-foreground">예상 비용</span>
                      <span className="font-bold text-primary">₩{estimatedCost.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Waiting animation */}
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-xs ml-2">구급대원 응답 대기 중</span>
                  </div>

                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full py-4 rounded-xl"
                  >
                    닫기 (상태는 알림으로 확인)
                  </Button>
                </motion.div>
              )}

              {callState === "accepted" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="text-center py-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Ambulance className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-1">
                      구급차가 출발했습니다!
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      곧 도착할 예정입니다
                    </p>
                  </div>

                  {/* ETA */}
                  <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                    <Clock className="w-5 h-5" />
                    <span>예상 도착: {estimatedTime}분</span>
                  </div>

                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full py-4 rounded-xl"
                  >
                    닫기
                  </Button>
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
