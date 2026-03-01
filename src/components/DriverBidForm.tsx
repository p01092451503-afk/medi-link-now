import { useState, useMemo } from "react";
import { DollarSign, Send, Loader2, Zap, MapPin, Clock, AlertTriangle, Heart, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PatientMedicalSummary {
  allergies?: string[];
  chronicDiseases?: string[];
  bloodType?: string;
  medications?: string[];
}

interface DriverBidFormProps {
  onSubmit: (amount: number, message?: string) => Promise<any>;
  isLoading: boolean;
  existingBid?: boolean;
  pickupLat?: number;
  pickupLng?: number;
  driverLat?: number;
  driverLng?: number;
  patientMedical?: PatientMedicalSummary | null;
}

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const DriverBidForm = ({ onSubmit, isLoading, existingBid, pickupLat, pickupLng, driverLat, driverLng, patientMedical }: DriverBidFormProps) => {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"instant" | "bid" | null>(null);

  const distanceInfo = useMemo(() => {
    if (pickupLat && pickupLng && driverLat && driverLng) {
      const dist = haversineDistance(driverLat, driverLng, pickupLat, pickupLng);
      const etaMinutes = Math.round((dist / 40) * 60);
      return { distance: dist, eta: etaMinutes };
    }
    return null;
  }, [pickupLat, pickupLng, driverLat, driverLng]);

  const handleInstantDispatch = async () => {
    const suggestedFee = distanceInfo ? Math.round(distanceInfo.distance * 5000) : 50000;
    await onSubmit(suggestedFee, "즉시 출동 가능");
  };

  const handleSubmit = async () => {
    const num = parseInt(amount);
    if (!num || num < 10000) return;
    await onSubmit(num, message || undefined);
    setAmount("");
    setMessage("");
    setMode(null);
  };

  if (existingBid) {
    return (
      <div className="bg-secondary rounded-2xl p-4 text-center">
        <p className="text-sm text-foreground font-medium">✅ 입찰 완료</p>
        <p className="text-xs text-muted-foreground mt-1">보호자의 선택을 기다리고 있습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-card rounded-2xl p-4 border border-border">
      {/* Distance / ETA Info */}
      {distanceInfo && (
        <div className="flex items-center gap-4 bg-secondary rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{distanceInfo.distance.toFixed(1)}km</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">약 {distanceInfo.eta}분</span>
          </div>
        </div>
      )}

      {/* Patient Medical Summary */}
      {patientMedical && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 space-y-1.5">
          <h5 className="text-xs font-bold text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            환자 의료 정보
          </h5>
          {patientMedical.bloodType && (
            <p className="text-xs text-foreground">혈액형: <span className="font-bold">{patientMedical.bloodType}</span></p>
          )}
          {patientMedical.allergies && patientMedical.allergies.length > 0 && (
            <p className="text-xs text-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-destructive" />
              알레르기: <span className="font-semibold">{patientMedical.allergies.join(", ")}</span>
            </p>
          )}
          {patientMedical.chronicDiseases && patientMedical.chronicDiseases.length > 0 && (
            <p className="text-xs text-foreground flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-500" />
              기저질환: <span className="font-semibold">{patientMedical.chronicDiseases.join(", ")}</span>
            </p>
          )}
          {patientMedical.medications && patientMedical.medications.length > 0 && (
            <p className="text-xs text-foreground flex items-center gap-1">
              <Pill className="w-3 h-3" />
              복용약: {patientMedical.medications.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Action Selection */}
      {mode === null && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleInstantDispatch}
            disabled={isLoading}
            className="min-h-[56px] flex-col gap-1.5 rounded-2xl bg-foreground text-background hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span className="text-xs font-bold">즉시 출동</span>
              </>
            )}
          </Button>
          <Button
            onClick={() => setMode("bid")}
            variant="outline"
            className="min-h-[56px] flex-col gap-1.5 rounded-2xl"
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-xs font-bold">요금 협의</span>
          </Button>
        </div>
      )}

      {/* Bid Form */}
      {mode === "bid" && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            입찰하기
          </h4>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">제시 금액 (원)</label>
            <Input
              type="number"
              placeholder="예: 70000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl min-h-[48px]"
              min={10000}
              step={5000}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">메시지 (선택)</label>
            <Textarea
              placeholder="예: 특수 장비 보유, 경력 5년"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setMode(null)}
              variant="outline"
              className="flex-1 min-h-[48px] rounded-xl"
            >
              뒤로
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !amount}
              className="flex-1 min-h-[48px] rounded-xl bg-foreground text-background hover:opacity-90"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1" /> 제출 중...</>
              ) : (
                <><Send className="w-4 h-4 mr-1" /> 입찰 제출</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverBidForm;
