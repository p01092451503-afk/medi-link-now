import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, Clock, MapPin, X, Navigation } from "lucide-react";
import { TrackedAmbulance } from "@/hooks/useGuardianAmbulanceTracking";

interface GuardianAmbulanceTrackerProps {
  ambulance: TrackedAmbulance | null;
  onClose?: () => void;
  onLocate?: () => void;
}

const GuardianAmbulanceTracker = ({ ambulance, onClose, onLocate }: GuardianAmbulanceTrackerProps) => {
  if (!ambulance) return null;

  const startedAt = new Date(ambulance.started_at);
  const elapsedMinutes = Math.round((Date.now() - startedAt.getTime()) / 60000);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        className="fixed bottom-24 left-4 right-4 z-[1000] max-w-md mx-auto"
      >
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-2xl shadow-emerald-500/30 overflow-hidden">
          {/* Animated top bar */}
          <div className="h-1 bg-white/20 overflow-hidden">
            <motion.div
              className="h-full bg-white/60"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "50%" }}
            />
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"
                >
                  <Ambulance className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h3 className="font-bold text-white text-lg">구급차 이동 중</h3>
                  <p className="text-emerald-100 text-sm">
                    {ambulance.driver_name || "배정된 기사"}님이 이동하고 있습니다
                  </p>
                </div>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 text-emerald-100 text-xs mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>목적지</span>
                </div>
                <p className="text-white font-semibold text-sm truncate">
                  {ambulance.destination_hospital_name}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 text-emerald-100 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>경과 시간</span>
                </div>
                <p className="text-white font-semibold text-sm">
                  {elapsedMinutes}분
                  {ambulance.estimated_arrival_minutes && (
                    <span className="text-emerald-200 text-xs ml-1">
                      / 예상 {ambulance.estimated_arrival_minutes}분
                    </span>
                  )}
                </p>
              </div>
            </div>

            {ambulance.current_lat && ambulance.current_lng && onLocate && (
              <button
                onClick={onLocate}
                className="w-full py-3 bg-white text-emerald-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
              >
                <Navigation className="w-5 h-5" />
                지도에서 위치 보기
              </button>
            )}

            {ambulance.patient_condition && (
              <p className="text-emerald-100 text-xs mt-3 text-center">
                환자 상태: {ambulance.patient_condition}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuardianAmbulanceTracker;
