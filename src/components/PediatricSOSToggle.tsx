import { motion, AnimatePresence } from "framer-motion";
import { Baby, X } from "lucide-react";

interface PediatricSOSToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

const PediatricSOSToggle = ({ isActive, onToggle }: PediatricSOSToggleProps) => {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all duration-300 ${
        isActive
          ? "bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sky-400/40"
          : "bg-white/90 backdrop-blur-sm text-sky-600 border-2 border-sky-300 hover:border-sky-400 shadow-sky-200/30"
      }`}
      aria-label="소아 SOS 모드 전환"
    >
      {/* Pulse animation when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full bg-sky-400/30"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      <span className="relative z-10 text-base">👶</span>
      <span className="relative z-10 whitespace-nowrap">
        {isActive ? "소아 SOS" : "소아 SOS"}
      </span>

      {isActive && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative z-10 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
        >
          <X className="w-3 h-3" />
        </motion.span>
      )}
    </motion.button>
  );
};

export default PediatricSOSToggle;
