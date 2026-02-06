import { motion } from "framer-motion";
import { X, MapPin, Phone } from "lucide-react";
import { Hospital, getHospitalStatus, calculateDistance } from "@/data/hospitals";
import { cleanHospitalName } from "@/lib/utils";

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
  // Sort hospitals by distance if user location is available
  const sortedHospitals = userLocation
    ? [...hospitals].sort((a, b) => {
        const distA = calculateDistance(userLocation[0], userLocation[1], a.lat, a.lng);
        const distB = calculateDistance(userLocation[0], userLocation[1], b.lat, b.lng);
        return distA - distB;
      })
    : hospitals;

  const getStatusColor = (hospital: Hospital) => {
    const status = getHospitalStatus(hospital);
    switch (status) {
      case "available":
        return "bg-green-500";
      case "limited":
        return "bg-yellow-500";
      default:
        return "bg-red-500";
    }
  };

  const getTotalBeds = (hospital: Hospital) => {
    const general = Math.max(0, hospital.beds?.general || 0);
    const pediatric = Math.max(0, hospital.beds?.pediatric || 0);
    const fever = Math.max(0, hospital.beds?.fever || 0);
    return general + pediatric + fever;
  };

  // Calculate popup position to keep it within viewport
  const getPopupStyle = () => {
    const popupWidth = 320;
    const popupMaxHeight = 400;
    const padding = 16;

    let left = position.x - popupWidth / 2;
    let top = position.y + 10;

    // Ensure popup stays within viewport horizontally
    if (left < padding) {
      left = padding;
    } else if (left + popupWidth > window.innerWidth - padding) {
      left = window.innerWidth - popupWidth - padding;
    }

    // If popup would go below viewport, show above click point
    if (top + popupMaxHeight > window.innerHeight - padding) {
      top = position.y - popupMaxHeight - 10;
    }

    return { left, top };
  };

  const popupStyle = getPopupStyle();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[2000] bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{
        left: popupStyle.left,
        top: popupStyle.top,
        width: 320,
        maxHeight: 400,
        color: '#111827', /* Force dark text — override any inherited Leaflet styles */
      }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-gray-900">
            {hospitals.length}개 병원
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Hospital List */}
      <div className="overflow-y-auto max-h-[320px]">
        {sortedHospitals.map((hospital, index) => {
          const distance = userLocation
            ? calculateDistance(
                userLocation[0],
                userLocation[1],
                hospital.lat,
                hospital.lng
              )
            : null;

          return (
            <button
              key={hospital.id}
              onClick={() => {
                onHospitalClick(hospital);
                onClose();
              }}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-b-0"
            >
              {/* Status indicator */}
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(hospital)} mt-1 flex-shrink-0`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900 truncate">
                    {cleanHospitalName(hospital.name)}
                  </span>
                  {(hospital.beds?.pediatric ?? 0) > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full whitespace-nowrap">
                      🌙 야간소아
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">
                    {getTotalBeds(hospital)}석
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
                      <span className="text-gray-400">
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
