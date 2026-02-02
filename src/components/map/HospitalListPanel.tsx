import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hospital, getHospitalStatus, calculateDistance } from "@/data/hospitals";
import { Phone, Navigation, Clock, Stethoscope, Baby, Thermometer, ChevronUp, MapPin, Activity } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cleanHospitalName } from "@/lib/utils";

interface HospitalListPanelProps {
  hospitals: Hospital[];
  userLocation: [number, number] | null;
  onHospitalClick: (hospital: Hospital) => void;
  selectedHospitalId?: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// Status priority for sorting (lower = higher priority)
const STATUS_PRIORITY = {
  available: 1,
  limited: 2,
  unavailable: 3,
};

const HospitalListPanel = ({
  hospitals,
  userLocation,
  onHospitalClick,
  selectedHospitalId,
  isExpanded,
  onToggleExpand,
}: HospitalListPanelProps) => {
  // Sort hospitals by status first, then by distance
  const sortedHospitals = useMemo(() => {
    return [...hospitals]
      .map((h) => ({
        ...h,
        distance: userLocation
          ? calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng)
          : undefined,
        status: getHospitalStatus(h),
      }))
      .sort((a, b) => {
        // First sort by status priority
        const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
        if (statusDiff !== 0) return statusDiff;
        
        // Then by distance if available
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return 0;
      });
  }, [hospitals, userLocation]);

  const availableCount = sortedHospitals.filter((h) => h.status === "available").length;
  const limitedCount = sortedHospitals.filter((h) => h.status === "limited").length;
  const unavailableCount = sortedHospitals.filter((h) => h.status === "unavailable").length;

  return (
    <motion.div
      className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-3xl overflow-hidden z-[1001]"
      initial={false}
      animate={{
        height: isExpanded ? "40vh" : "auto",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Handle Bar */}
      <button
        onClick={onToggleExpand}
        className="w-full py-3 flex flex-col items-center gap-2 bg-gradient-to-b from-white to-gray-50/50"
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
        
        {/* Summary Stats */}
        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">
              {sortedHospitals.length}개 병원
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">{availableCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-amber-600">{limitedCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-600">{unavailableCount}</span>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp className="w-5 h-5 text-gray-400" />
          </motion.div>
        </div>
      </button>

      {/* Hospital List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            <ScrollArea className="h-[calc(40vh-80px)]">
              <div className="px-4 pb-4 space-y-2">
                {sortedHospitals.map((hospital, index) => {
                  const isSelected = hospital.id === selectedHospitalId;
                  const normalizedBeds = {
                    general: Math.max(0, hospital.beds.general),
                    pediatric: Math.max(0, hospital.beds.pediatric),
                    fever: Math.max(0, hospital.beds.fever),
                  };
                  const totalBeds = normalizedBeds.general + normalizedBeds.pediatric + normalizedBeds.fever;
                  
                  const statusColor = 
                    hospital.status === "available" ? "border-l-emerald-500 bg-emerald-50/50" :
                    hospital.status === "limited" ? "border-l-amber-500 bg-amber-50/50" :
                    "border-l-red-500 bg-red-50/50";
                  
                  const statusBadge = 
                    hospital.status === "available" ? { bg: "bg-emerald-100", text: "text-emerald-700", label: "수용가능" } :
                    hospital.status === "limited" ? { bg: "bg-amber-100", text: "text-amber-700", label: "혼잡" } :
                    { bg: "bg-red-100", text: "text-red-700", label: "수용불가" };

                  return (
                    <motion.button
                      key={hospital.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => onHospitalClick(hospital)}
                      className={`w-full text-left p-3 rounded-xl border-l-4 ${statusColor} ${
                        isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
                      } transition-all`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                              {statusBadge.label}
                            </span>
                            {hospital.isTraumaCenter && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                                외상
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-gray-900 truncate">{cleanHospitalName(hospital.nameKr)}</h4>
                          <p className="text-xs text-gray-500 truncate">{hospital.category}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {hospital.distance !== undefined && (
                            <div className="flex items-center gap-1 text-primary">
                              <MapPin className="w-3 h-3" />
                              <span className="text-xs font-bold">{hospital.distance.toFixed(1)}km</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 bg-white rounded-full px-2 py-0.5 shadow-sm">
                            <Stethoscope className="w-3 h-3 text-primary" />
                            <span className="text-xs font-bold text-primary">{totalBeds}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bed breakdown */}
                      <div className="flex items-center gap-3 text-[10px] text-gray-500">
                        <span className={`flex items-center gap-0.5 ${normalizedBeds.general > 0 ? "text-emerald-600 font-medium" : ""}`}>
                          <Stethoscope className="w-3 h-3" /> 성인 {normalizedBeds.general}
                        </span>
                        <span className={`flex items-center gap-0.5 ${normalizedBeds.pediatric > 0 ? "text-emerald-600 font-medium" : ""}`}>
                          <Baby className="w-3 h-3" /> 소아 {normalizedBeds.pediatric}
                        </span>
                        <span className={`flex items-center gap-0.5 ${normalizedBeds.fever > 0 ? "text-emerald-600 font-medium" : ""}`}>
                          <Thermometer className="w-3 h-3" /> 열/감염 {normalizedBeds.fever}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
                
                {sortedHospitals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">현재 지도 영역에 표시된 병원이 없습니다</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HospitalListPanel;
