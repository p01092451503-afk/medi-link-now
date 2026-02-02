import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, Clock, Navigation, Pill, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Hospital, calculateDistance } from "@/data/hospitals";
import { cleanHospitalName } from "@/lib/utils";
import type { HolidayPharmacy } from "@/hooks/useHolidayPharmacies";

interface NearbyPharmacySheetProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital;
  pharmacies: HolidayPharmacy[];
  isLoading: boolean;
}

// Predefined tags that could be added by users/admins in the future
const PHARMACY_TAGS = [
  { id: "fever", label: "해열제 보유", color: "bg-red-100 text-red-700" },
  { id: "tylenol", label: "타이레놀 보유", color: "bg-blue-100 text-blue-700" },
  { id: "pediatric", label: "소아용 시럽", color: "bg-amber-100 text-amber-700" },
  { id: "24h", label: "24시간", color: "bg-green-100 text-green-700" },
];

// Check if pharmacy is currently open
const isPharmacyOpenNow = (pharmacy: HolidayPharmacy): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 100 + currentMinute;
  
  // Check if it's a holiday or weekend
  const dayOfWeek = now.getDay();
  const isHoliday = dayOfWeek === 0 || dayOfWeek === 6; // Weekend as proxy for holiday
  
  if (isHoliday && pharmacy.holidayOpen && pharmacy.holidayClose) {
    const openTime = parseInt(pharmacy.holidayOpen.replace(":", ""), 10);
    const closeTime = pharmacy.holidayClose === "24:00" ? 2400 : parseInt(pharmacy.holidayClose.replace(":", ""), 10);
    return currentTime >= openTime && currentTime < closeTime;
  }
  
  // For regular days, assume open during business hours
  return currentHour >= 9 && currentHour < 21;
};

const NearbyPharmacySheet = ({ isOpen, onClose, hospital, pharmacies, isLoading }: NearbyPharmacySheetProps) => {
  const [selectedPharmacy, setSelectedPharmacy] = useState<HolidayPharmacy | null>(null);

  // Calculate distance and sort pharmacies
  const nearbyPharmacies = useMemo(() => {
    if (!pharmacies.length) return [];
    
    return pharmacies
      .map((pharmacy) => ({
        ...pharmacy,
        distance: calculateDistance(hospital.lat, hospital.lng, pharmacy.lat, pharmacy.lng),
        isOpen: isPharmacyOpenNow(pharmacy),
      }))
      .filter((p) => p.isOpen) // Only show open pharmacies
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3); // Top 3 closest
  }, [pharmacies, hospital.lat, hospital.lng]);

  const handleNavigate = (pharmacy: HolidayPharmacy) => {
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(pharmacy.name)},${pharmacy.lat},${pharmacy.lng}`;
    window.open(url, "_blank");
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const formatTime = (open?: string, close?: string) => {
    if (!open || !close) return "정보 없음";
    const formatHour = (time: string) => {
      if (time.length === 4) {
        return `${time.slice(0, 2)}:${time.slice(2)}`;
      }
      return time;
    };
    return `${formatHour(open)} - ${formatHour(close)}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[1003]"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[1004] max-h-[70vh] overflow-hidden"
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">근처 문 연 약국</h3>
                <p className="text-xs text-muted-foreground">
                  {cleanHospitalName(hospital.nameKr)} 기준
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && nearbyPharmacies.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Pill className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground">
                현재 영업 중인 약국이 없습니다
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                휴일/심야 약국 데이터를 불러오는 중입니다
              </p>
            </div>
          )}

          {/* Pharmacy List */}
          {!isLoading && nearbyPharmacies.length > 0 && (
            <div className="space-y-3">
              {nearbyPharmacies.map((pharmacy, index) => (
                <motion.div
                  key={pharmacy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">💊</span>
                        <h4 className="font-bold text-foreground">{pharmacy.name}</h4>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                          영업중
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="line-clamp-1">{pharmacy.address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <Navigation className="w-3.5 h-3.5" />
                          {formatDistance(pharmacy.distance)}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(pharmacy.holidayOpen, pharmacy.holidayClose)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tag placeholder area */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs border border-dashed border-gray-300">
                      <Tag className="w-3 h-3" />
                      <span>태그 추가 예정</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {pharmacy.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCall(pharmacy.phone)}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        전화
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleNavigate(pharmacy)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      길찾기
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Info Note */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            💡 약국 정보는 공공데이터포털 기준이며, 실제 운영시간과 다를 수 있습니다
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NearbyPharmacySheet;
