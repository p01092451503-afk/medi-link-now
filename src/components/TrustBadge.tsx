import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const TrustBadge = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="absolute top-0 left-0 right-0 z-[1002] flex justify-center pt-1 pointer-events-none"
    >
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-slate-700/40 shadow-sm pointer-events-auto">
        <ShieldCheck className="w-3 h-3 text-primary flex-shrink-0" />
        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          ⚡ Powered by NEDIS & 119 Data&nbsp;|&nbsp;Non-profit Project
        </span>
      </div>
    </motion.div>
  );
};

export default TrustBadge;
