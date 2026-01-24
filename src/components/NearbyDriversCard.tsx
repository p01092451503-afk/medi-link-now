import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ambulance, 
  MapPin, 
  Clock, 
  Phone, 
  ChevronDown, 
  Loader2,
  Navigation
} from "lucide-react";
import { DriverPresence } from "@/hooks/useDriverPresence";
import { calculateDistance } from "@/data/hospitals";

interface NearbyDriversCardProps {
  drivers: DriverPresence[];
  userLocation: [number, number] | null;
  onCallDriver: (driver: DriverPresence) => void;
  isLoading?: boolean;
}

interface DriverWithDistance extends DriverPresence {
  distance: number;
  estimatedMinutes: number;
}

const NearbyDriversCard = ({ 
  drivers, 
  userLocation, 
  onCallDriver,
  isLoading = false 
}: NearbyDriversCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate distances and sort
  const driversWithDistance: DriverWithDistance[] = userLocation
    ? drivers
        .filter((d) => d.status === "available")
        .map((driver) => {
          const distance = calculateDistance(
            userLocation[0],
            userLocation[1],
            driver.lat,
            driver.lng
          );
          return {
            ...driver,
            distance,
            estimatedMinutes: Math.max(1, Math.round((distance / 30) * 60)), // ~30km/h urban speed
          };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
    : [];

  const availableCount = drivers.filter((d) => d.status === "available").length;

  if (!userLocation) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Navigation className="w-4 h-4" />
          <span className="text-sm">위치를 켜면 주변 구급대원을 찾습니다</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div
        onClick={() => driversWithDistance.length > 0 && setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between px-4 py-3 ${
          driversWithDistance.length > 0 ? "cursor-pointer hover:bg-gray-50" : ""
        } transition-colors`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Ambulance className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">주변 구급대원</h4>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                "검색 중..."
              ) : availableCount > 0 ? (
                <span className="text-green-600 font-medium">{availableCount}명 대기 중</span>
              ) : (
                "현재 대기 중인 구급대원이 없습니다"
              )}
            </p>
          </div>
        </div>

        {driversWithDistance.length > 0 && (
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        )}

        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </div>

      {/* Expanded Driver List */}
      <AnimatePresence>
        {isExpanded && driversWithDistance.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {driversWithDistance.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <Ambulance className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{driver.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {driver.distance.toFixed(1)}km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        약 {driver.estimatedMinutes}분
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCallDriver(driver);
                    }}
                    className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    호출
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Call Button when collapsed and drivers available */}
      {!isExpanded && driversWithDistance.length > 0 && (
        <div className="px-4 pb-3">
          <button
            onClick={() => onCallDriver(driversWithDistance[0])}
            className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Phone className="w-4 h-4" />
            가장 가까운 구급대원 호출 ({driversWithDistance[0].estimatedMinutes}분)
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default NearbyDriversCard;
