import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

interface RadiusChipsProps {
  activeRadius: number | "all";
  onRadiusChange: (radius: number) => void;
  userLocation: [number, number] | null;
}

const radiusOptions: { value: number; label: string; km: number }[] = [
  { value: 5, label: "5km", km: 5 },
  { value: 10, label: "10km", km: 10 },
  { value: 20, label: "20km", km: 20 },
  { value: 30, label: "30km", km: 30 },
];

const RadiusChips = ({ activeRadius, onRadiusChange, userLocation }: RadiusChipsProps) => {
  return (
    <div className="flex items-center gap-1 md:gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-1.5 md:px-2 py-1 md:py-1.5 shadow-lg border border-gray-200">
      <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary ml-0.5 md:ml-1 flex-shrink-0" />
      <div className="flex gap-0.5 md:gap-1">
        {radiusOptions.map((option) => {
          const isActive = activeRadius === option.value;
          const isDisabled = !userLocation;
          
          return (
            <motion.button
              key={option.value}
              onClick={() => !isDisabled && onRadiusChange(option.value)}
              disabled={isDisabled}
              className={`relative px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : isDisabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default RadiusChips;
