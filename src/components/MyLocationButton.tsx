import { Crosshair, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface MyLocationButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const MyLocationButton = ({ onClick, isLoading }: MyLocationButtonProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      animate={!isLoading ? {
        scale: [1, 1.08, 1],
        boxShadow: [
          "0 4px 14px 0 rgba(59, 130, 246, 0.3)",
          "0 6px 20px 0 rgba(59, 130, 246, 0.5)",
          "0 4px 14px 0 rgba(59, 130, 246, 0.3)"
        ]
      } : {}}
      transition={!isLoading ? {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
      onClick={onClick}
      disabled={isLoading}
      className="fab-button bottom-safe-2 right-4"
      aria-label="Center on my location"
    >
      {isLoading ? (
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      ) : (
        <Crosshair className="w-6 h-6 text-primary" />
      )}
    </motion.button>
  );
};

export default MyLocationButton;
