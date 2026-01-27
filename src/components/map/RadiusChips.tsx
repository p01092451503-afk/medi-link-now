import { motion } from "framer-motion";
import { MapPin, Globe } from "lucide-react";

interface RadiusChipsProps {
  activeRadius: number | "all";
  onRadiusChange: (radius: number | "all") => void;
  userLocation: [number, number] | null;
}

const radiusOptions: { value: number | "all"; label: string; km?: number }[] = [
  { value: 5, label: "5km", km: 5 },
  { value: 10, label: "10km", km: 10 },
  { value: 20, label: "20km", km: 20 },
  { value: "all", label: "전체" },
];

const RadiusChips = ({ activeRadius, onRadiusChange, userLocation }: RadiusChipsProps) => {
  return (
    <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-lg border border-gray-200">
      <MapPin className="w-3.5 h-3.5 text-primary ml-1" />
      <div className="flex gap-1">
        {radiusOptions.map((option) => {
          const isActive = activeRadius === option.value;
          const isDisabled = option.value !== "all" && !userLocation;
          
          return (
            <motion.button
              key={option.value}
              onClick={() => !isDisabled && onRadiusChange(option.value)}
              disabled={isDisabled}
              className={`relative px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : isDisabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
            >
              {option.value === "all" ? (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {option.label}
                </span>
              ) : (
                option.label
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default RadiusChips;
