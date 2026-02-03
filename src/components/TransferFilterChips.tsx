import { motion, AnimatePresence } from "framer-motion";
import { useTransferMode, TransferFilterType } from "@/contexts/TransferModeContext";

// Primary filters (1st level)
const primaryFilters: { id: TransferFilterType; labelKr: string }[] = [
  { id: "all", labelKr: "전체" },
  { id: "hospital", labelKr: "일반 병원" },
  { id: "nursing", labelKr: "요양병원" },
];

// Secondary filters (2nd level - shown when "hospital" is selected)
const secondaryFilters: { id: TransferFilterType; labelKr: string }[] = [
  { id: "icu-general", labelKr: "일반 중환자실" },
  { id: "icu-neuro", labelKr: "신경계 중환자실" },
  { id: "icu-cardio", labelKr: "심장 중환자실" },
  { id: "ward", labelKr: "일반병실" },
  { id: "isolation", labelKr: "격리병실" },
];

// Check if a filter is a secondary filter
const isSecondaryFilter = (filter: TransferFilterType): boolean => {
  return secondaryFilters.some(f => f.id === filter);
};

// Color indicators for filter types
const getFilterColorIndicator = (filterId: TransferFilterType): string | null => {
  switch (filterId) {
    case "hospital":
      return "bg-emerald-500";
    case "nursing":
      return "bg-purple-500";
    default:
      return null;
  }
};

const TransferFilterChips = () => {
  const { transferFilter, setTransferFilter } = useTransferMode();

  // Show secondary filters when "hospital" is selected or any secondary filter is active
  const showSecondaryFilters = transferFilter === "hospital" || isSecondaryFilter(transferFilter);

  // Determine which primary filter is "active" (for highlighting)
  const getActivePrimary = (): TransferFilterType => {
    if (isSecondaryFilter(transferFilter)) return "hospital";
    return transferFilter;
  };

  const activePrimary = getActivePrimary();

  return (
    <div className="absolute top-20 left-0 right-0 z-10 px-4 space-y-2">
      {/* Primary Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {primaryFilters.map((filter) => {
          const colorIndicator = getFilterColorIndicator(filter.id);
          const isActive = activePrimary === filter.id;
          return (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTransferFilter(filter.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-purple-600"
                  : "bg-card text-muted-foreground border-border hover:border-purple-400 hover:text-purple-600"
              }`}
            >
              {colorIndicator && (
                <span className={`w-3 h-3 rounded-full ${colorIndicator} ${isActive ? "ring-2 ring-white/50" : ""}`} />
              )}
              {filter.labelKr}
            </motion.button>
          );
        })}
      </div>

      {/* Secondary Filters (shown when "hospital" is selected) */}
      <AnimatePresence>
        {showSecondaryFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          >
            {secondaryFilters.map((filter) => {
              const isActive = transferFilter === filter.id;
              return (
                <motion.button
                  key={filter.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTransferFilter(filter.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    isActive
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-card/90 text-muted-foreground border-border hover:border-emerald-400 hover:text-emerald-600"
                  }`}
                >
                  {filter.labelKr}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransferFilterChips;
