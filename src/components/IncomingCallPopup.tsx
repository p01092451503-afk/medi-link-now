import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, User, AlertCircle, DollarSign, Check, X } from "lucide-react";
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
}

interface IncomingCallPopupProps {
  call: IncomingCallData | null;
  onAccept: (requestId: string) => Promise<boolean>;
  onReject: () => void;
}

const IncomingCallPopup = ({ call, onAccept, onReject }: IncomingCallPopupProps) => {
  const [isAccepting, setIsAccepting] = useState(false);

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
        <div className="bg-foreground p-5 text-background">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-background/10 flex items-center justify-center animate-pulse">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold">🚨 새로운 호출!</h3>
              <p className="text-sm opacity-70">가까운 환자가 도움을 요청합니다</p>
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
            className="flex-1 py-5 rounded-2xl"
          >
            <X className="w-5 h-5 mr-1" />
            거절
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="flex-1 py-5 rounded-2xl bg-foreground text-background hover:opacity-90"
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
