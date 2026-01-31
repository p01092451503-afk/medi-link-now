import { motion } from "framer-motion";
import { X, MapPin, Stethoscope, Baby, Thermometer, Phone, Navigation } from "lucide-react";
import { Hospital, getHospitalStatus, calculateDistance } from "@/data/hospitals";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClusterPopupProps {
  hospitals: Hospital[];
  userLocation: [number, number] | null;
  onHospitalClick: (hospital: Hospital) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const STATUS_PRIORITY = {
  available: 1,
  limited: 2,
  unavailable: 3,
};

const ClusterPopup = ({
  hospitals,
  userLocation,
  onHospitalClick,
  onClose,
  position,
}: ClusterPopupProps) => {
  // Sort by status first, then distance
  const sortedHospitals = [...hospitals]
    .map((h) => ({
      ...h,
      distance: userLocation
        ? calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng)
        : undefined,
      status: getHospitalStatus(h),
    }))
    .sort((a, b) => {
      const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      if (statusDiff !== 0) return statusDiff;
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });

  const availableCount = sortedHospitals.filter((h) => h.status === "available").length;
  const limitedCount = sortedHospitals.filter((h) => h.status === "limited").length;
  const unavailableCount = sortedHospitals.filter((h) => h.status === "unavailable").length;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-[1100]"
      />

      {/* Popup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
        className="fixed z-[1101] bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{
          left: Math.min(Math.max(16, position.x - 160), window.innerWidth - 336),
          top: Math.min(Math.max(100, position.y - 200), window.innerHeight - 420),
          width: 320,
          maxHeight: 400,
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="font-bold">이 지역 병원 {hospitals.length}개</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status summary */}
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>수용가능 {availableCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>혼잡 {limitedCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span>만실 {unavailableCount}</span>
            </div>
          </div>
        </div>

        {/* Hospital List */}
        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-2">
            {sortedHospitals.map((hospital, index) => {
              const normalizedBeds = {
                general: Math.max(0, hospital.beds.general),
                pediatric: Math.max(0, hospital.beds.pediatric),
                fever: Math.max(0, hospital.beds.fever),
              };
              const totalBeds = normalizedBeds.general + normalizedBeds.pediatric + normalizedBeds.fever;

              const statusStyles =
                hospital.status === "available"
                  ? { border: "border-l-emerald-500", bg: "bg-emerald-50/50", badge: "bg-emerald-100 text-emerald-700" }
                  : hospital.status === "limited"
                    ? { border: "border-l-amber-500", bg: "bg-amber-50/50", badge: "bg-amber-100 text-amber-700" }
                    : { border: "border-l-red-500", bg: "bg-red-50/50", badge: "bg-red-100 text-red-700" };

              return (
                <motion.button
                  key={hospital.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => {
                    onHospitalClick(hospital);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-xl border-l-4 ${statusStyles.border} ${statusStyles.bg} hover:shadow-md transition-all`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusStyles.badge}`}>
                          {hospital.status === "available" ? "수용가능" : hospital.status === "limited" ? "혼잡" : "만실"}
                        </span>
                        {hospital.isTraumaCenter && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
                            외상
                          </span>
                        )}
                        {normalizedBeds.pediatric > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                            🌙 야간소아
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm truncate">{hospital.nameKr}</h4>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {hospital.distance !== undefined && (
                        <span className="text-xs font-bold text-primary">{hospital.distance.toFixed(1)}km</span>
                      )}
                      <div className="flex items-center gap-1 bg-white rounded-full px-2 py-0.5 shadow-sm">
                        <Stethoscope className="w-3 h-3 text-primary" />
                        <span className="text-xs font-bold text-primary">{totalBeds}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bed breakdown */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className={`flex items-center gap-0.5 ${normalizedBeds.general > 0 ? "text-emerald-600 font-medium" : ""}`}>
                      <Stethoscope className="w-3 h-3" /> {normalizedBeds.general}
                    </span>
                    <span className={`flex items-center gap-0.5 ${normalizedBeds.pediatric > 0 ? "text-emerald-600 font-medium" : ""}`}>
                      <Baby className="w-3 h-3" /> {normalizedBeds.pediatric}
                    </span>
                    <span className={`flex items-center gap-0.5 ${normalizedBeds.fever > 0 ? "text-emerald-600 font-medium" : ""}`}>
                      <Thermometer className="w-3 h-3" /> {normalizedBeds.fever}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </ScrollArea>
      </motion.div>
    </>
  );
};

export default ClusterPopup;
