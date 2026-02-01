import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";

interface RadiusChipsProps {
  activeRadius: number | "all";
  onRadiusChange: (radius: number) => void;
  userLocation: [number, number] | null;
  lastUpdated?: Date | null;
}

const radiusOptions: { value: number; label: string }[] = [
  { value: 5, label: "5km" },
  { value: 10, label: "10km" },
  { value: 20, label: "20km" },
  { value: 30, label: "30km" },
];

const RadiusChips = ({ activeRadius, onRadiusChange, userLocation, lastUpdated }: RadiusChipsProps) => {
  const getTimeDisplay = () => {
    if (!lastUpdated) return null;
    return lastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  const timeDisplay = getTimeDisplay();

  return (
    <div className="flex items-center gap-2">
      {/* Update Time Badge */}
      {timeDisplay && (
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-md border border-gray-100">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] text-gray-500 font-medium">{timeDisplay} 기준</span>
        </div>
      )}

      {/* Radius Selector */}
      <div className="flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1 py-0.5 shadow-md border border-gray-100">
        <MapPin className="w-3 h-3 text-primary ml-1 flex-shrink-0" />
        <div className="flex gap-0.5">
          {radiusOptions.map((option) => {
            const isActive = activeRadius === option.value;
            const isDisabled = !userLocation;
            
            return (
              <motion.button
                key={option.value}
                onClick={() => !isDisabled && onRadiusChange(option.value)}
                disabled={isDisabled}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white"
                    : isDisabled
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-100"
                }`}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
              >
                {option.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RadiusChips;
