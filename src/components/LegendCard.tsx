import { motion } from "framer-motion";

const LegendCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="absolute bottom-28 left-4 z-10 bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-soft"
    >
      <h4 className="text-xs font-semibold text-foreground mb-2">Bed Availability</h4>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-warning" />
          <span className="text-xs text-muted-foreground">Limited</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-danger" />
          <span className="text-xs text-muted-foreground">Full</span>
        </div>
      </div>
    </motion.div>
  );
};

export default LegendCard;
