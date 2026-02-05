import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ambulance, Loader2, Phone, MapPin, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hospital } from "@/data/hospitals";
import { cleanHospitalName } from "@/lib/utils";

interface AmbulanceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital | null;
  distance?: number;
}

type CallState = "confirm" | "searching" | "found" | "en-route";

const AmbulanceCallModal = ({ isOpen, onClose, hospital, distance }: AmbulanceCallModalProps) => {
  const [callState, setCallState] = useState<CallState>("confirm");
  const estimatedCost = distance ? Math.round(50000 + distance * 5000) : 75000;
  const estimatedTime = distance ? Math.round(5 + distance * 2) : 10;

  useEffect(() => {
    if (!isOpen) {
      setCallState("confirm");
    }
  }, [isOpen]);

  const handleCallAmbulance = () => {
    setCallState("searching");
    
    // Simulate searching for driver
    setTimeout(() => {
      setCallState("found");
    }, 2000);

    // Simulate driver accepting
    setTimeout(() => {
      setCallState("en-route");
    }, 4000);
  };

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
             // Mobile: pin to safe viewport with internal scroll (prevents cut-off)
             // sm+: center like a classic modal
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
              {callState === "confirm" && (
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

                  {/* Warning */}
                  <p className="text-xs text-muted-foreground text-center">
                    ※ 실제 비용은 거리 및 상황에 따라 달라질 수 있습니다
                  </p>

                  {/* CTA Button */}
                  <Button
                    onClick={handleCallAmbulance}
                    className="w-full py-6 rounded-xl text-base font-semibold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    호출하기
                  </Button>
                </motion.div>
              )}

              {callState === "searching" && (
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
                    구급차를 찾고 있습니다...
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    가까운 드라이버에게 연결 중
                  </p>
                </motion.div>
              )}

              {callState === "found" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    드라이버를 찾았습니다!
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    호출을 수락하는 중...
                  </p>
                </motion.div>
              )}

              {callState === "en-route" && (
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

                  {/* Driver Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">김</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">김기사님</p>
                        <p className="text-sm text-muted-foreground">⭐ 4.9 · 응급운행 152회</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => window.location.href = "tel:010-1234-5678"}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
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
