import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Clock, MapPin, Navigation, AlertTriangle, Moon, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NearbyPharmacy } from "@/hooks/useNearbyPharmacies";

interface PharmacyBottomSheetProps {
  pharmacy: NearbyPharmacy | null;
  isOpen: boolean;
  onClose: () => void;
}

// Format time from HHMM to HH:MM
const formatTime = (time?: string): string => {
  if (!time || time.length < 4) return "-";
  return `${time.slice(0, 2)}:${time.slice(2)}`;
};

// Get today's day name in Korean
const getTodayName = (): string => {
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  return days[new Date().getDay()];
};

// Check if pharmacy is a night pharmacy
const isNightPharmacy = (pharmacy: NearbyPharmacy): boolean => {
  const closeTime = parseInt(pharmacy.todayCloseTime || "0", 10);
  return closeTime >= 2200 || closeTime < 400;
};

// Check if pharmacy has holiday hours
const hasHolidayHours = (pharmacy: NearbyPharmacy): boolean => {
  return !!(pharmacy.dutyTime7s || pharmacy.dutyTime8s);
};

const PharmacyBottomSheet = ({ pharmacy, isOpen, onClose }: PharmacyBottomSheetProps) => {
  if (!pharmacy) return null;

  const handleCall = () => {
    if (pharmacy.phone) {
      window.location.href = `tel:${pharmacy.phone}`;
    }
  };

  const handleNavigate = () => {
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(pharmacy.name)},${pharmacy.lat},${pharmacy.lng}`;
    window.open(url, "_blank");
  };

  const formatDistance = (km?: number): string => {
    if (!km) return "";
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[1003]"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-[1004] max-h-[80vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>

            <div className="px-5 pb-8 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                    <span className="text-2xl">💊</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-xl font-bold text-foreground">{pharmacy.name}</h2>
                      <Badge className="bg-green-500 text-white">영업중</Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isNightPharmacy(pharmacy) && (
                        <Badge variant="outline" className="border-indigo-300 text-indigo-600 bg-indigo-50">
                          <Moon className="w-3 h-3 mr-1" />
                          심야약국
                        </Badge>
                      )}
                      {hasHolidayHours(pharmacy) && (
                        <Badge variant="outline" className="border-amber-300 text-amber-600 bg-amber-50">
                          <Calendar className="w-3 h-3 mr-1" />
                          휴일지킴이
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Info Grid */}
              <div className="space-y-3">
                {/* Today's Hours */}
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <Clock className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-green-600 font-medium">{getTodayName()} 운영시간</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatTime(pharmacy.todayOpenTime)} - {formatTime(pharmacy.todayCloseTime)}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">주소</p>
                    <p className="text-base text-foreground">{pharmacy.address}</p>
                    {pharmacy.distance && (
                      <p className="text-sm text-primary font-medium mt-1">
                        내 위치에서 {formatDistance(pharmacy.distance)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                {pharmacy.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">전화번호</p>
                      <p className="text-base text-foreground font-medium">{pharmacy.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Warning Message */}
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">
                    방문 전 반드시 전화로 운영 여부를 확인하세요
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    실제 운영시간은 공공데이터와 다를 수 있습니다
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleCall}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-14 text-base font-bold shadow-lg shadow-green-500/30"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  📞 전화로 확인하기
                </Button>
                <Button
                  onClick={handleNavigate}
                  size="lg"
                  variant="outline"
                  className="border-2 border-green-500 text-green-700 hover:bg-green-50 rounded-xl h-14 text-base font-bold"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  길찾기
                </Button>
              </div>

              {/* Weekly Hours (Collapsible) */}
              <details className="group">
                <summary className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer list-none">
                  <span className="text-sm font-medium text-foreground">주간 운영시간 보기</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">월요일</span>
                    <span>{formatTime(pharmacy.dutyTime1s)} - {formatTime(pharmacy.dutyTime1c)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">화요일</span>
                    <span>{formatTime(pharmacy.dutyTime2s)} - {formatTime(pharmacy.dutyTime2c)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">수요일</span>
                    <span>{formatTime(pharmacy.dutyTime3s)} - {formatTime(pharmacy.dutyTime3c)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">목요일</span>
                    <span>{formatTime(pharmacy.dutyTime4s)} - {formatTime(pharmacy.dutyTime4c)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">금요일</span>
                    <span>{formatTime(pharmacy.dutyTime5s)} - {formatTime(pharmacy.dutyTime5c)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>토요일</span>
                    <span>{formatTime(pharmacy.dutyTime6s)} - {formatTime(pharmacy.dutyTime6c)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>일요일</span>
                    <span>{formatTime(pharmacy.dutyTime7s)} - {formatTime(pharmacy.dutyTime7c)}</span>
                  </div>
                  {(pharmacy.dutyTime8s || pharmacy.dutyTime8c) && (
                    <div className="flex justify-between text-amber-600 font-medium">
                      <span>공휴일</span>
                      <span>{formatTime(pharmacy.dutyTime8s)} - {formatTime(pharmacy.dutyTime8c)}</span>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PharmacyBottomSheet;
