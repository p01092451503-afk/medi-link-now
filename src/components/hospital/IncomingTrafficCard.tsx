import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, AlertTriangle, TrendingDown, Info, ChevronDown } from "lucide-react";
import { usePrivateTraffic } from "@/contexts/PrivateTrafficContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IncomingTrafficCardProps {
  hospitalId: number;
  officialBeds: number;
}

const IncomingTrafficCard = ({ hospitalId, officialBeds }: IncomingTrafficCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getTrafficCount, isHighTraffic, getAdjustedBeds } = usePrivateTraffic();
  
  const trafficCount = getTrafficCount(hospitalId);
  const highTraffic = isHighTraffic(hospitalId);
  const adjustedBeds = getAdjustedBeds(hospitalId, officialBeds);
  const isFull = adjustedBeds === 0;

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-colors ${
          highTraffic 
            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700" 
            : trafficCount > 0 
              ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" 
              : "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            highTraffic ? "bg-amber-200 dark:bg-amber-900/50" : "bg-blue-100 dark:bg-blue-900/50"
          }`}>
            <Truck className={`w-3.5 h-3.5 ${highTraffic ? "text-amber-700 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"}`} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">민간 구급차 이송 현황</h4>
            <p className="text-[10px] text-muted-foreground">Private Ambulances En Route</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOpen && (
            <div className="flex items-center gap-2">
              {highTraffic && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-200 dark:bg-amber-900/50 rounded-full">
                  <AlertTriangle className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">혼잡</span>
                </span>
              )}
              <span className={`text-sm font-bold ${
                highTraffic ? "text-amber-600 dark:text-amber-400" : trafficCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
              }`}>
                {trafficCount}대
              </span>
            </div>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {/* Traffic Counter */}
              <div className={`p-4 rounded-xl border-2 ${
                highTraffic 
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700" 
                  : trafficCount > 0 
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" 
                    : "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700"
              }`}>
                <div className="flex items-center justify-center gap-4 py-3">
                  <div className="text-center">
                    <span className={`text-4xl font-bold ${
                      highTraffic ? "text-amber-600 dark:text-amber-400" : trafficCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-slate-500"
                    }`}>
                      {trafficCount}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">대 이송 중</p>
                  </div>
                </div>

                {trafficCount > 0 && (
                  <p className="text-[10px] text-center text-muted-foreground">
                    현재 {trafficCount}대의 민간 구급차가 이 병원으로 이송 중입니다
                  </p>
                )}
              </div>

              {/* Real-time Estimated Availability */}
              <div className={`p-4 rounded-xl border-2 ${
                isFull 
                  ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800" 
                  : adjustedBeds <= 2 
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" 
                    : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className={`w-4 h-4 ${
                    isFull ? "text-red-600 dark:text-red-400" : adjustedBeds <= 2 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                  }`} />
                  <h4 className="text-sm font-semibold text-foreground">실시간 추정 가용량</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[250px]">
                        <p className="text-xs">
                          공식 병상 수에서 이송 중인 민간 구급차 수를 차감한 실시간 추정치입니다.
                          실제 가용 병상과 다를 수 있습니다.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Calculation Display */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="text-center px-3 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <p className="text-lg font-bold text-gray-700 dark:text-slate-200">{officialBeds}</p>
                    <p className="text-[9px] text-muted-foreground">공식 병상</p>
                  </div>
                  <span className="text-xl font-bold text-gray-400 dark:text-slate-500">−</span>
                  <div className="text-center px-3 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{trafficCount}</p>
                    <p className="text-[9px] text-muted-foreground">이송 중</p>
                  </div>
                  <span className="text-xl font-bold text-gray-400 dark:text-slate-500">=</span>
                  <div className={`text-center px-4 py-2 rounded-lg shadow-sm ${
                    isFull 
                      ? "bg-red-100 dark:bg-red-900/50" 
                      : adjustedBeds <= 2 
                        ? "bg-amber-100 dark:bg-amber-900/50" 
                        : "bg-emerald-100 dark:bg-emerald-900/50"
                  }`}>
                    <p className={`text-2xl font-bold ${
                      isFull 
                        ? "text-red-600 dark:text-red-400" 
                        : adjustedBeds <= 2 
                          ? "text-amber-600 dark:text-amber-400" 
                          : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {adjustedBeds}
                    </p>
                    <p className="text-[9px] text-muted-foreground">추정 가용</p>
                  </div>
                </div>

                {isFull && (
                  <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-center">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                      ⚠️ 추정 만실 - 다른 병원을 고려해주세요
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IncomingTrafficCard;
