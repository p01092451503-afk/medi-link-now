import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useRealtimeReturnTrips } from "@/hooks/useRealtimeReturnTrips";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReturnTripRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName: string;
  patientName?: string;
}

/** 법정 요금 기준 간이 계산 (일반 구급차) */
const calculateFare = (distanceKm: number): number => {
  const baseFare = 30000;
  const extraKm = Math.max(0, distanceKm - 10);
  const extraFare = extraKm * 1000;
  const total = baseFare + extraFare;

  // 심야 할증 (00:00~04:00)
  const hour = new Date().getHours();
  const isNight = hour >= 0 && hour < 4;
  return isNight ? Math.round(total * 1.2) : total;
};

/** 시/도 추출 헬퍼 */
const extractCity = (text: string): string => {
  const match = text.match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/);
  return match ? match[1] : "미정";
};

const ReturnTripRequestModal = ({
  isOpen,
  onClose,
  hospitalName,
  patientName: initialPatientName,
}: ReturnTripRequestModalProps) => {
  const { createTrip } = useRealtimeReturnTrips();

  const [destination, setDestination] = useState("");
  const [distanceInput, setDistanceInput] = useState("");
  const [patientName, setPatientName] = useState(initialPatientName || "");
  const [passengerCount, setPassengerCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const distanceKm = parseFloat(distanceInput) || 0;
  const estimatedFare = useMemo(() => calculateFare(distanceKm), [distanceKm]);

  const handleSubmit = async () => {
    if (!destination.trim()) {
      toast({ title: "목적지를 입력해주세요", variant: "destructive" });
      return;
    }
    if (!patientName.trim()) {
      toast({ title: "환자(탑승자) 이름을 입력해주세요", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const success = await createTrip({
      pickup_location: hospitalName,
      pickup_city: extractCity(hospitalName),
      destination: destination.trim(),
      destination_city: extractCity(destination.trim()),
      distance: distanceKm > 0 ? `${distanceKm}km` : "미정",
      estimated_fee: estimatedFare,
      patient_name: patientName.trim(),
      patient_condition: "stable",
      patient_age: null,
      patient_gender: null,
    });

    setIsSubmitting(false);

    if (success) {
      toast({
        title: "🚑 복귀편 요청이 등록되었습니다",
        description: "근처 기사에게 알림이 전송됩니다.",
      });
      setDestination("");
      setDistanceInput("");
      setPatientName(initialPatientName || "");
      setPassengerCount(1);
      onClose();
    } else {
      toast({ title: "요청 실패", description: "다시 시도해주세요.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            복귀편 예약
          </DialogTitle>
          <DialogDescription>
            이송 완료 후 귀가를 위한 구급차를 예약합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Origin (auto-filled) */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">출발지</label>
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground font-medium truncate">{hospitalName}</span>
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">목적지</label>
            <Input
              placeholder="귀가 목적지 주소 입력"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          {/* Patient name */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">탑승자 이름</label>
            <Input
              placeholder="이름"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          {/* Distance (manual) */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">예상 거리 (km)</label>
            <Input
              type="number"
              placeholder="예: 15"
              value={distanceInput}
              onChange={(e) => setDistanceInput(e.target.value)}
              className="h-11 rounded-xl"
              min={0}
            />
          </div>

          {/* Passenger count */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              탑승 인원
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <motion.button
                  key={n}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPassengerCount(n)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    passengerCount === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-foreground border-border hover:bg-accent"
                  }`}
                >
                  {n}명
                </motion.button>
              ))}
            </div>
          </div>

          {/* Fare estimate */}
          <div className="bg-secondary rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {hospitalName}
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                {destination || "목적지"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-sm text-muted-foreground">예상 요금</span>
              <span className="text-lg font-bold text-foreground">
                ₩{estimatedFare.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              * 일반 구급차 기준, 실제 요금은 거리에 따라 달라질 수 있습니다
            </p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-5 rounded-2xl text-base font-bold"
          >
            {isSubmitting ? "등록 중..." : "복귀편 예약 요청"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnTripRequestModal;
