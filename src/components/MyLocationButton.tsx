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
      onClick={onClick}
      disabled={isLoading}
      className="fab-button bottom-32 right-4"
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
