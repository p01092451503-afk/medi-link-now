import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, Clock, Navigation, Pill, Moon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { NearbyPharmacy } from "@/hooks/useNearbyPharmacies";

interface NearbyPharmacyListSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacies: NearbyPharmacy[];
  isLoading: boolean;
  error?: string | null;
  onSelectPharmacy?: (pharmacy: NearbyPharmacy) => void;
  searchRadiusKm?: number;
}

const formatTime = (time?: string): string => {
  if (!time || time.length < 4) return "-";
  return `${time.slice(0, 2)}:${time.slice(2)}`;
};

const formatDistance = (km?: number): string => {
  if (!km) return "";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

const NearbyPharmacyListSheet = ({
  isOpen,
  onClose,
  pharmacies,
  isLoading,
  error,
  onSelectPharmacy,
  searchRadiusKm = 5,
}: NearbyPharmacyListSheetProps) => {
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleNavigate = (pharmacy: NearbyPharmacy) => {
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(pharmacy.name)},${pharmacy.lat},${pharmacy.lng}`;
    window.open(url, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-[1004] max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center py-3 flex-shrink-0">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>

            <div className="px-5 pb-8 flex-1 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">주변 약국</h3>
                    <p className="text-xs text-muted-foreground">
                      내 위치 기준 {searchRadiusKm}km 이내 · 영업중
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Loading */}
              {isLoading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">약국 정보를 불러오는 중...</span>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {!isLoading && error && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                    <Pill className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    약국 정보를 불러오지 못했습니다
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{error}</p>
                </div>
              )}

              {/* No Results */}
              {!isLoading && !error && pharmacies.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                    <Pill className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    현재 영업 중인 약국이 없습니다
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    심야 시간에는 심야약국 필터를 확인해보세요
                  </p>
                </div>
              )}

              {/* Pharmacy List */}
              {!isLoading && !error && pharmacies.length > 0 && (
                <div className="space-y-3">
                  {pharmacies.slice(0, 10).map((pharmacy, index) => (
                    <motion.div
                      key={pharmacy.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-xl border border-green-100 dark:border-green-900/40"
                      onClick={() => onSelectPharmacy?.(pharmacy)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-lg">💊</span>
                            <h4 className="font-bold text-foreground truncate">{pharmacy.name}</h4>
                            <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                              영업중
                            </Badge>
                            {pharmacy.isNightPharmacy && (
                              <Badge variant="outline" className="border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-[10px] px-1.5 py-0">
                                <Moon className="w-3 h-3 mr-0.5" />
                                심야
                              </Badge>
                            )}
                            {pharmacy.is24h && (
                              <Badge variant="outline" className="border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0">
                                24h
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="line-clamp-1">{pharmacy.address || "주소 정보 없음"}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            {pharmacy.distance !== undefined && (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                <Navigation className="w-3.5 h-3.5" />
                                {formatDistance(pharmacy.distance)}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(pharmacy.todayOpenTime)} - {formatTime(pharmacy.todayCloseTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {pharmacy.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCall(pharmacy.phone);
                            }}
                            className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            전화
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(pharmacy);
                          }}
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
                💡 약국 정보는 건강보험심사평가원 공공데이터 기준이며, 실제 운영과 다를 수 있습니다
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NearbyPharmacyListSheet;
