import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ambulance, 
  MapPin, 
  Clock, 
  Phone, 
  ChevronUp,
  Navigation
} from "lucide-react";
import AmbulanceLoader from "@/components/AmbulanceLoader";
import { DriverPresence } from "@/hooks/useDriverPresence";
import { calculateDistance } from "@/data/hospitals";

interface NearbyDriversCardProps {
  drivers: DriverPresence[];
  userLocation: [number, number] | null;
  onCallDriver: (driver: DriverPresence) => void;
  isLoading?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface DriverWithDistance extends DriverPresence {
  distance: number;
  estimatedMinutes: number;
}

const NearbyDriversCard = ({ 
  drivers, 
  userLocation, 
  onCallDriver,
  isLoading = false,
  isCollapsed = false,
  onToggleCollapse
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
      <div className="bg-white rounded-xl shadow-lg p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Navigation className="w-3.5 h-3.5" />
          <span className="text-xs">위치를 켜면 주변 구급대원을 찾습니다</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header - Always visible */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-primary/5 border-b border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
      >
        <div 
          className="flex items-center gap-2 flex-1"
          onClick={() => !isCollapsed && driversWithDistance.length > 0 && setIsExpanded(!isExpanded)}
        >
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <Ambulance className="w-3 h-3 text-green-600" />
          </div>
          <h4 className="text-xs font-semibold">주변 구급대원</h4>
        </div>
        <div className="flex items-center gap-1">
          {isLoading && <AmbulanceLoader variant="inline" />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.();
            }}
            className="p-1 hover:bg-primary/10 rounded-full transition-colors"
          >
            <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Content - Collapsible */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2">
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

            {/* Expanded Driver List */}
            <AnimatePresence>
              {isExpanded && driversWithDistance.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2">
                    {driversWithDistance.map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <Ambulance className="w-4 h-4 text-white" />
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{driver.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {driver.distance.toFixed(1)}km
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              약 {driver.estimatedMinutes}분
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCallDriver(driver);
                          }}
                          className="px-2 py-1.5 bg-primary text-white rounded-lg text-[10px] font-medium flex items-center gap-1 hover:bg-primary/90 transition-colors"
                        >
                          <Phone className="w-2.5 h-2.5" />
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
              <div className="px-3 pb-3">
                <button
                  onClick={() => onCallDriver(driversWithDistance[0])}
                  className="w-full py-2 bg-primary text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  가장 가까운 구급대원 호출 ({driversWithDistance[0].estimatedMinutes}분)
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NearbyDriversCard;
