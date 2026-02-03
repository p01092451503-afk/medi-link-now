import { motion } from "framer-motion";
import { Siren, Truck } from "lucide-react";
import { useTransferMode, AppMode } from "@/contexts/TransferModeContext";

const ModeToggle = () => {
  const { mode, setMode } = useTransferMode();

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
  };

  return (
    <div className="flex items-center gap-1 bg-card rounded-full p-1 shadow-lg border border-border">
      <button
        onClick={() => handleModeChange("emergency")}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          mode === "emergency"
            ? "text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {mode === "emergency" && (
          <motion.div
            layoutId="modeToggleBg"
            className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Siren className="w-3.5 h-3.5 relative z-10" />
        <span className="relative z-10">119 응급</span>
      </button>
      
      <button
        onClick={() => handleModeChange("transfer")}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          mode === "transfer"
            ? "text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {mode === "transfer" && (
          <motion.div
            layoutId="modeToggleBg"
            className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Truck className="w-3.5 h-3.5 relative z-10" />
        <span className="relative z-10">비응급 이송</span>
      </button>
    </div>
  );
};

export default ModeToggle;
