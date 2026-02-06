import { motion } from "framer-motion";
import { X } from "lucide-react";

interface PediatricSOSToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

const PediatricSOSToggle = ({ isActive, onToggle }: PediatricSOSToggleProps) => {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.95 }}
      animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
        isActive
          ? "bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-md shadow-sky-500/30"
          : "bg-white/70 backdrop-blur-sm text-gray-600 border border-gray-200/60 hover:bg-white/90"
      }`}
      aria-label="소아 SOS 모드 전환"
    >
      <span className="text-xs">👶</span>
      <span>소아 SOS</span>

      {isActive && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center"
        >
          <X className="w-2.5 h-2.5" />
        </motion.span>
      )}
    </motion.button>
  );
};

export default PediatricSOSToggle;
