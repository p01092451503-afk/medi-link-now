import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Users, ArrowRight, Loader2, Search } from "lucide-react";
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

  const hour = new Date().getHours();
  const isNight = hour >= 0 && hour < 4;
  return isNight ? Math.round(total * 1.2) : total;
};

/** 시/도 추출 헬퍼 */
const extractCity = (text: string): string => {
  const match = text.match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/);
  return match ? match[1] : "미정";
};

/** 카카오맵 주소/키워드 → 좌표 변환 */
const getCoords = (address: string): Promise<{ lat: number; lng: number }> => {
  const kakao = (window as any).kakao;
  if (!kakao?.maps?.services) {
    return Promise.reject(new Error("카카오맵 API를 사용할 수 없습니다"));
  }

  const geocoder = new kakao.maps.services.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.addressSearch(address, (result: any, status: any) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
      } else {
        // 주소 검색 실패 시 키워드 검색
        const places = new kakao.maps.services.Places();
        places.keywordSearch(address, (placeResult: any, placeStatus: any) => {
          if (placeStatus === kakao.maps.services.Status.OK) {
            resolve({ lat: parseFloat(placeResult[0].y), lng: parseFloat(placeResult[0].x) });
          } else {
            reject(new Error("주소를 찾을 수 없습니다"));
          }
        });
      }
    });
  });
};

/** Haversine 직선거리 → 도로거리 추정 */
const calcRoadDistance = (
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): number => {
  const R = 6371;
  const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
  const dLon = ((dest.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((dest.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1.3 * 10) / 10; // ×1.3 도로 보정
};

const ReturnTripRequestModal = ({
  isOpen,
  onClose,
  hospitalName,
  patientName: initialPatientName,
}: ReturnTripRequestModalProps) => {
  const { createTrip } = useRealtimeReturnTrips();

  const [destination, setDestination] = useState("");
  const [distanceKm, setDistanceKm] = useState(0);
  const [patientName, setPatientName] = useState(initialPatientName || "");
  const [passengerCount, setPassengerCount] = useState(1);
  const [requestedTime, setRequestedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalcDistance, setIsCalcDistance] = useState(false);
  const [distanceCalculated, setDistanceCalculated] = useState(false);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<{ place_name: string; address_name: string; road_address_name?: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchKeyword = useCallback((query: string) => {
    const kakao = (window as any).kakao;
    if (!kakao?.maps?.services || query.length < 2) {
      setSuggestions([]);
      return;
    }
    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(query, (data: any[], status: any) => {
      if (status === kakao.maps.services.Status.OK) {
        setSuggestions(
          data.slice(0, 5).map((d: any) => ({
            place_name: d.place_name,
            address_name: d.address_name,
            road_address_name: d.road_address_name,
          }))
        );
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    });
  }, []);

  const handleDestinationChange = useCallback(
    (value: string) => {
      setDestination(value);
      setDistanceCalculated(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchKeyword(value), 300);
    },
    [searchKeyword]
  );

  const selectSuggestion = useCallback(
    (s: { place_name: string; address_name: string; road_address_name?: string }) => {
      const addr = s.road_address_name || s.address_name;
      setDestination(`${s.place_name} (${addr})`);
      setShowSuggestions(false);
      setSuggestions([]);
      setDistanceCalculated(false);
    },
    []
  );

  const estimatedFare = useMemo(() => calculateFare(distanceKm), [distanceKm]);

  const handleCalcDistance = useCallback(async () => {
    if (!destination.trim()) {
      toast({ title: "목적지를 입력해주세요", variant: "destructive" });
      return;
    }

    setIsCalcDistance(true);
    try {
      const [originCoords, destCoords] = await Promise.all([
        getCoords(hospitalName),
        getCoords(destination.trim()),
      ]);
      const dist = calcRoadDistance(originCoords, destCoords);
      setDistanceKm(dist);
      setDistanceCalculated(true);
      toast({ title: "거리 계산 완료", description: `예상 거리: ${dist}km` });
    } catch (err) {
      console.error("Distance calc error:", err);
      toast({
        title: "거리 계산 실패",
        description: "주소를 확인하고 다시 시도해주세요. 직접 입력도 가능합니다.",
        variant: "destructive",
      });
    } finally {
      setIsCalcDistance(false);
    }
  }, [hospitalName, destination]);

  const handleSubmit = async () => {
    if (!destination.trim()) {
      toast({ title: "목적지를 입력해주세요", variant: "destructive" });
      return;
    }
    if (!patientName.trim()) {
      toast({ title: "탑승자 이름을 입력해주세요", variant: "destructive" });
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
      setDistanceKm(0);
      setDistanceCalculated(false);
      setPatientName(initialPatientName || "");
      setPassengerCount(1);
      setRequestedTime("");
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
          {/* Origin */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">출발지</label>
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground font-medium truncate">{hospitalName}</span>
            </div>
          </div>

          {/* Destination + auto-calc */}
          <div ref={wrapperRef} className="relative">
            <label className="text-xs font-medium text-foreground mb-1 block">목적지</label>
            <div className="flex gap-2">
              <Input
                placeholder="귀가 목적지 주소 또는 장소명 입력"
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="h-11 rounded-xl flex-1"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl shrink-0"
                onClick={handleCalcDistance}
                disabled={isCalcDistance || !destination.trim()}
                title="거리 자동 계산"
              >
                {isCalcDistance ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-12 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                    onClick={() => selectSuggestion(s)}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{s.place_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {s.road_address_name || s.address_name}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {distanceCalculated && distanceKm > 0 && (
              <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                카카오맵 기준 약 {distanceKm}km
              </p>
            )}
          </div>
            )}
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

          {/* Requested departure time */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">희망 출발 시간</label>
            <Input
              type="datetime-local"
              value={requestedTime}
              onChange={(e) => setRequestedTime(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          {/* Manual distance fallback */}
          {!distanceCalculated && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                거리 직접 입력 (km) — 자동 계산 실패 시
              </label>
              <Input
                type="number"
                placeholder="예: 15"
                value={distanceKm || ""}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                className="h-11 rounded-xl"
                min={0}
              />
            </div>
          )}

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
            {distanceKm > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>예상 거리</span>
                <span className="font-medium text-foreground">{distanceKm}km</span>
              </div>
            )}
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
