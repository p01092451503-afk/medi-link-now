import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  MapPin, 
  User, 
  FileText, 
  Send, 
  Send,
  Ambulance,
  Navigation,
  Clock,
  Timer,
  Users
} from "lucide-react";
import { DriverPresence } from "@/hooks/useDriverPresence";
import { useDispatchRequests } from "@/hooks/useDispatchRequests";
import { useDriverPresence } from "@/hooks/useDriverPresence";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface DispatchRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDriver?: DriverPresence | null;
  userLocation: [number, number] | null;
  pickupAddress?: string;
}

// Haversine distance in km
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const DispatchRequestModal = ({
  isOpen,
  onClose,
  selectedDriver,
  userLocation,
  pickupAddress = "",
}: DispatchRequestModalProps) => {
  const { createRequest, isLoading, pendingRequests, myRequests } = useDispatchRequests();
  const { nearbyDrivers } = useDriverPresence();
  const [formData, setFormData] = useState({
    patientName: "",
    patientCondition: "",
    pickupLocation: pickupAddress,
    destination: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  // Sort drivers by distance
  const sortedDrivers = userLocation
    ? [...nearbyDrivers]
        .filter(d => d.status === "available")
        .map(d => ({
          ...d,
          distance: haversineDistance(userLocation[0], userLocation[1], d.lat, d.lng),
          etaMinutes: Math.round((haversineDistance(userLocation[0], userLocation[1], d.lat, d.lng) / 40) * 60),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
    : [];

  // Countdown timer after submission
  useEffect(() => {
    if (!submitted) return;
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [submitted, countdown]);

  // Check if request was accepted
  const acceptedRequest = myRequests.find(
    r => r.id === submittedRequestId && r.status === "accepted"
  );

  useEffect(() => {
    if (acceptedRequest) {
      setSubmitted(false);
    }
  }, [acceptedRequest]);

  const handleSubmit = async () => {
    if (!userLocation) return;

    const nearestDriver = sortedDrivers[0];
    const request = await createRequest({
      pickup_location: formData.pickupLocation || "현재 위치",
      pickup_lat: userLocation[0],
      pickup_lng: userLocation[1],
      destination: formData.destination || undefined,
      patient_name: formData.patientName || undefined,
      patient_condition: formData.patientCondition || undefined,
      notes: formData.notes || undefined,
      estimated_distance_km: nearestDriver?.distance ?? (selectedDriver
        ? haversineDistance(userLocation[0], userLocation[1], selectedDriver.lat, selectedDriver.lng)
        : undefined),
    });

    if (request) {
      setSubmittedRequestId(request.id);
      setSubmitted(true);
      setCountdown(30);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setCountdown(30);
    setSubmittedRequestId(null);
    setFormData({ patientName: "", patientCondition: "", pickupLocation: "", destination: "", notes: "" });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[2000]"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[2001] bg-background rounded-t-3xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-muted rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                    <Ambulance className="w-7 h-7 text-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">구급대원 호출</h2>
                    {selectedDriver ? (
                      <p className="text-sm text-muted-foreground">
                        {selectedDriver.name}님에게 요청
                      </p>
                    ) : sortedDrivers.length > 0 ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        근처 {sortedDrivers.length}명 대기 중
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="min-w-[56px] min-h-[56px] flex items-center justify-center hover:bg-secondary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Post-submission: Countdown + Waiting */}
            {submitted ? (
              <div className="p-6 space-y-5">
                {/* Countdown Ring */}
                <div className="flex flex-col items-center py-6">
                  <div className="relative w-28 h-28 mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke={countdown > 10 ? "hsl(var(--foreground))" : "hsl(var(--destructive))"}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={264}
                        strokeDashoffset={264 - (countdown / 30) * 264}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-foreground">{countdown}</span>
                      <span className="text-xs text-muted-foreground">초</span>
                    </div>
                  </div>
                  <p className="text-base font-semibold text-foreground">
                    {countdown > 0 ? "구급대원 연결 중..." : "시간 초과 — 다시 시도해주세요"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">가까운 기사에게 알림을 보냈습니다</p>
                </div>

                {/* Nearest Drivers */}
                {sortedDrivers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      추천 기사 (거리순)
                    </h4>
                    {sortedDrivers.slice(0, 3).map((driver, idx) => (
                      <div
                        key={driver.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border ${
                          idx === 0 ? "border-foreground/30 bg-foreground/5" : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            idx === 0 ? "bg-foreground text-background" : "bg-secondary text-foreground"
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{driver.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {driver.distance.toFixed(1)}km · 약 {driver.etaMinutes}분
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {driver.etaMinutes}분
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {countdown <= 0 && (
                  <Button
                    onClick={() => { setCountdown(30); }}
                    className="w-full min-h-[56px] text-base font-bold rounded-2xl bg-foreground text-background hover:opacity-90"
                  >
                    <Timer className="w-5 h-5 mr-2" />
                    다시 호출하기
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Form */}
                <div className="p-6 space-y-4">
                  {!userLocation && (
                    <div className="flex items-center gap-2 p-3 bg-secondary rounded-2xl text-sm text-muted-foreground">
                      <Navigation className="w-4 h-4" />
                      <span>위치 서비스를 켜주세요</span>
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <User className="w-4 h-4" />
                      환자 이름 (선택)
                    </label>
                    <Input
                      placeholder="환자 이름을 입력하세요"
                      value={formData.patientName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, patientName: e.target.value }))}
                      className="rounded-xl min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <FileText className="w-4 h-4" />
                      환자 상태 (선택)
                    </label>
                    <Input
                      placeholder="예: 가슴 통증, 호흡 곤란"
                      value={formData.patientCondition}
                      onChange={(e) => setFormData((prev) => ({ ...prev, patientCondition: e.target.value }))}
                      className="rounded-xl min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      픽업 위치
                    </label>
                    <Input
                      placeholder="상세 주소 또는 랜드마크"
                      value={formData.pickupLocation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pickupLocation: e.target.value }))}
                      className="rounded-xl min-h-[48px]"
                    />
                    {userLocation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        현재 위치: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      목적지 (선택)
                    </label>
                    <Input
                      placeholder="병원 이름 또는 주소"
                      value={formData.destination}
                      onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
                      className="rounded-xl min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      추가 메모
                    </label>
                    <Textarea
                      placeholder="구급대원에게 전달할 내용 (예: 아파트 동/호수, 접근 방법)"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="p-6 pt-0">
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !userLocation}
                    className="w-full min-h-[56px] text-base font-bold rounded-2xl bg-foreground text-background hover:opacity-90"
                  >
                    {isLoading ? (
                      <AmbulanceLoader variant="inline" message="요청 중" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        구급대원 호출 요청
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DispatchRequestModal;
