import { motion } from "framer-motion";
import { X, MapPin, Phone } from "lucide-react";
import { Hospital, calculateDistance } from "@/data/hospitals";
import { cleanHospitalName } from "@/lib/utils";
import { useResolvedTheme } from "@/hooks/useResolvedTheme";

interface ClusterPopupProps {
  hospitals: Hospital[];
  userLocation: [number, number] | null;
  onHospitalClick: (hospital: Hospital) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const ClusterPopup = ({
  hospitals,
  userLocation,
  onHospitalClick,
  onClose,
  position,
}: ClusterPopupProps) => {
  const resolvedTheme = useResolvedTheme();
  const isDark = resolvedTheme === "dark";

  const sortedHospitals = userLocation
    ? [...hospitals].sort((a, b) => {
        const distA = calculateDistance(userLocation[0], userLocation[1], a.lat, a.lng);
        const distB = calculateDistance(userLocation[0], userLocation[1], b.lat, b.lng);
        return distA - distB;
      })
    : hospitals;

  const getTotalBeds = (hospital: Hospital) => {
    const general = Math.max(0, hospital.beds?.general || 0);
    const pediatric = Math.max(0, hospital.beds?.pediatric || 0);
    const fever = Math.max(0, hospital.beds?.fever || 0);
    return general + pediatric + fever;
  };

  const getStatusInfo = (hospital: Hospital) => {
    const beds = getTotalBeds(hospital);
    if (beds > 0) {
      return { label: "여유", color: "bg-emerald-500", textColor: isDark ? "text-emerald-400" : "text-emerald-600" };
    }
    return { label: "혼잡", color: "bg-red-500", textColor: isDark ? "text-red-400" : "text-red-600" };
  };

  const getPopupStyle = () => {
    const popupWidth = 320;
    const popupMaxHeight = 400;
    const padding = 16;

    let left = position.x - popupWidth / 2;
    let top = position.y + 10;

    if (left < padding) {
      left = padding;
    } else if (left + popupWidth > window.innerWidth - padding) {
      left = window.innerWidth - popupWidth - padding;
    }

    if (top + popupMaxHeight > window.innerHeight - padding) {
      top = position.y - popupMaxHeight - 10;
    }

    return { left, top };
  };

  const popupStyle = getPopupStyle();

  // Count available / unavailable
  const availableCount = hospitals.filter((h) => getTotalBeds(h) > 0).length;
  const unavailableCount = hospitals.length - availableCount;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={`fixed z-[2000] rounded-xl shadow-2xl border overflow-hidden ${
        isDark
          ? "bg-gray-800 text-gray-100 border-gray-700"
          : "bg-white text-gray-900 border-gray-200"
      }`}
      style={{
        left: popupStyle.left,
        top: popupStyle.top,
        width: 320,
        maxHeight: 400,
      }}
    >
      {/* Header */}
      <div
        className={`sticky top-0 border-b px-4 py-3 flex items-center justify-between ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className={`font-semibold text-sm ${isDark ? "text-gray-100" : "text-gray-900"}`}>
            {hospitals.length}개 병원
          </span>
          <div className="flex items-center gap-1.5 ml-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {availableCount}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              {unavailableCount}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-full transition-colors ${
            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
        >
          <X className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
        </button>
      </div>

      {/* Hospital List */}
      <div className="overflow-y-auto max-h-[320px]">
        {sortedHospitals.map((hospital) => {
          const distance = userLocation
            ? calculateDistance(userLocation[0], userLocation[1], hospital.lat, hospital.lng)
            : null;

          const status = getStatusInfo(hospital);
          const beds = getTotalBeds(hospital);

          return (
            <button
              key={hospital.id}
              onClick={() => {
                onHospitalClick(hospital);
                onClose();
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left border-b last:border-b-0 ${
                isDark
                  ? "hover:bg-gray-700 border-gray-700/50"
                  : "hover:bg-gray-50 border-gray-50"
              }`}
            >
              {/* Hospital info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm truncate ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                    {cleanHospitalName(hospital.name)}
                  </span>
                </div>

                <div className={`flex items-center gap-2 mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  <span className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {beds}석
                  </span>
                  {distance !== null && (
                    <>
                      <span>•</span>
                      <span>{distance.toFixed(1)}km</span>
                    </>
                  )}
                  {hospital.emergencyGrade && (
                    <>
                      <span>•</span>
                      <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                        {hospital.emergencyGrade === "regional_center"
                          ? "권역"
                          : hospital.emergencyGrade === "local_center"
                          ? "지역센터"
                          : "지역기관"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${
                  beds > 0
                    ? isDark
                      ? "bg-emerald-900/50 text-emerald-300"
                      : "bg-emerald-50 text-emerald-700"
                    : isDark
                    ? "bg-red-900/50 text-red-300"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
                {status.label}
              </div>

              {/* Quick call button */}
              {hospital.phone && (
                <a
                  href={`tel:${hospital.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-primary/10 hover:bg-primary/20 rounded-full transition-colors flex-shrink-0"
                >
                  <Phone className="w-4 h-4 text-primary" />
                </a>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ClusterPopup;
