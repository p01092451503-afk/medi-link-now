import { motion, AnimatePresence } from "framer-motion";
import { X, Pill, Loader2, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { NearbyPharmacy } from "@/hooks/useNearbyPharmacies";
import PharmacyCard from "@/components/pharmacy/PharmacyCard";

interface NearbyPharmacyListSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacies: NearbyPharmacy[];
  isLoading: boolean;
  error?: string | null;
  onSelectPharmacy?: (pharmacy: NearbyPharmacy) => void;
  searchRadiusKm?: number;
}

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
                      내 위치 기준 {searchRadiusKm}km 이내
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

              {/* Radius Expanded Notice */}
              {!isLoading && searchRadiusKm > 5 && pharmacies.length > 0 && (
                <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    5km 이내에 약국이 없어 <strong>{searchRadiusKm}km</strong>로 검색 범위를 확장했습니다
                  </p>
                </div>
              )}

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
                    주변에 약국이 없습니다
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    검색 범위 내 등록된 약국이 없습니다
                  </p>
                </div>
              )}

              {/* Pharmacy List */}
              {!isLoading && !error && pharmacies.length > 0 && (
                <div className="space-y-3">
                  {pharmacies.slice(0, 20).map((pharmacy, index) => (
                    <PharmacyCard
                      key={pharmacy.id}
                      pharmacy={pharmacy}
                      index={index}
                      onSelect={onSelectPharmacy}
                      onCall={handleCall}
                      onNavigate={handleNavigate}
                    />
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
