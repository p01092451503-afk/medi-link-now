import { motion } from "framer-motion";
import { useTransferMode, transferFilterOptions, TransferFilterType } from "@/contexts/TransferModeContext";

// Color indicators for filter types
const getFilterColorIndicator = (filterId: TransferFilterType): string | null => {
  switch (filterId) {
    case "hospital":
      return "bg-emerald-500"; // Same as general hospital markers
    case "nursing":
      return "bg-purple-500"; // Same as nursing hospital markers
    default:
      return null;
  }
};

const TransferFilterChips = () => {
  const { transferFilter, setTransferFilter } = useTransferMode();

  return (
    <div className="absolute top-20 left-0 right-0 z-10 px-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {transferFilterOptions.map((filter) => {
          const colorIndicator = getFilterColorIndicator(filter.id);
          return (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTransferFilter(filter.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                transferFilter === filter.id
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-purple-600"
                  : "bg-card text-muted-foreground border-border hover:border-purple-400 hover:text-purple-600"
              }`}
            >
              {colorIndicator && (
                <span className={`w-3 h-3 rounded-full ${colorIndicator} ${transferFilter === filter.id ? "ring-2 ring-white/50" : ""}`} />
              )}
              {filter.labelKr}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default TransferFilterChips;
