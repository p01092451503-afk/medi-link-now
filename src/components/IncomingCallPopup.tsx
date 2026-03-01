import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, User, AlertCircle, DollarSign, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IncomingCallData {
  request_id: string;
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  destination?: string;
  patient_name?: string;
  patient_condition?: string;
  estimated_fee?: number;
  distance_km?: number;
  eta_minutes?: number;
}

interface IncomingCallPopupProps {
  call: IncomingCallData | null;
  onAccept: (requestId: string) => Promise<boolean>;
  onReject: () => void;
}

const IncomingCallPopup = ({ call, onAccept, onReject }: IncomingCallPopupProps) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!call) { setCountdown(30); return; }
    if (countdown <= 0) { onReject(); return; }
    const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [call, countdown, onReject]);

  if (!call) return null;

  const handleAccept = async () => {
    setIsAccepting(true);
    await onAccept(call.request_id);
    setIsAccepting(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[3000]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: "spring", damping: 20 }}
        className="fixed inset-x-4 top-20 z-[3001] bg-background rounded-3xl shadow-2xl border border-border overflow-hidden max-w-md mx-auto"
      >
        {/* Pulsing header */}
        <div className="bg-foreground p-5 text-background relative overflow-hidden">
          {/* Countdown bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-background/30 transition-all duration-1000" style={{ width: `${(countdown / 30) * 100}%` }} />
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-background/10 flex items-center justify-center animate-pulse">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">🚨 새로운 호출!</h3>
              <p className="text-sm opacity-70">가까운 환자가 도움을 요청합니다</p>
            </div>
            <div className="flex flex-col items-center bg-background/10 rounded-xl px-3 py-2">
              <span className="text-xl font-bold">{countdown}</span>
              <span className="text-[10px] opacity-70">초</span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {call.patient_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{call.patient_name}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">{call.pickup_location}</span>
          </div>
          {call.destination && (
            <div className="flex items-start gap-2 text-sm">
              <Navigation className="w-4 h-4 text-foreground mt-0.5" />
              <span className="text-foreground font-medium">{call.destination}</span>
            </div>
          )}
          {call.patient_condition && (
            <div className="text-xs bg-secondary rounded-xl px-3 py-2 text-muted-foreground">
              환자 상태: {call.patient_condition}
            </div>
          )}

          {/* Distance & ETA */}
          {(call.distance_km || call.eta_minutes) && (
            <div className="flex items-center gap-4 bg-secondary rounded-xl px-4 py-3 text-sm">
              {call.distance_km && (
                <span className="flex items-center gap-1 text-foreground">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {call.distance_km.toFixed(1)}km
                </span>
              )}
              {call.eta_minutes && (
                <span className="flex items-center gap-1 text-foreground font-semibold">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  약 {call.eta_minutes}분
                </span>
              )}
            </div>
          )}

          {call.estimated_fee && (
            <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> 예상 요금
              </span>
              <span className="text-xl font-bold text-foreground">
                ₩{call.estimated_fee.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <Button
            onClick={onReject}
            variant="outline"
            className="flex-1 min-h-[56px] rounded-2xl text-base"
          >
            <X className="w-5 h-5 mr-1" />
            거절
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="flex-1 min-h-[56px] rounded-2xl bg-foreground text-background hover:opacity-90 text-base"
          >
            <Check className="w-5 h-5 mr-1" />
            {isAccepting ? "수락 중..." : "수락"}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallPopup;
