import { motion } from "framer-motion";
import { useTransferMode, TransferFilterType } from "@/contexts/TransferModeContext";

const filters: { id: TransferFilterType; labelKr: string }[] = [
  { id: "all", labelKr: "전체" },
  { id: "hospital", labelKr: "일반 병원" },
  { id: "nursing", labelKr: "요양병원" },
];

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

  return (
    <div className="absolute top-[5.5rem] left-0 right-0 z-[999] px-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((filter) => {
          const colorIndicator = getFilterColorIndicator(filter.id);
          const isActive = transferFilter === filter.id;
          return (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.95 }}
              animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => setTransferFilter(filter.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/30"
                  : "bg-white/70 backdrop-blur-sm text-gray-600 border border-gray-200/60 hover:bg-white/90"
              }`}
            >
              {colorIndicator && (
                <span className={`w-2.5 h-2.5 rounded-full ${colorIndicator} ${isActive ? "ring-2 ring-white/50" : ""}`} />
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
