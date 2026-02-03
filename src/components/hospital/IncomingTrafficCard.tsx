import { motion } from "framer-motion";
import { Truck, AlertTriangle, TrendingDown, Info } from "lucide-react";
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
  const { getTrafficCount, isHighTraffic, getAdjustedBeds } = usePrivateTraffic();
  
  const trafficCount = getTrafficCount(hospitalId);
  const highTraffic = isHighTraffic(hospitalId);
  const adjustedBeds = getAdjustedBeds(hospitalId, officialBeds);
  const isFull = adjustedBeds === 0;

  return (
    <div className="space-y-3">
      {/* Incoming Traffic Section */}
      <div className={`p-4 rounded-xl border-2 ${
        highTraffic 
          ? "bg-amber-50 border-amber-300" 
          : trafficCount > 0 
            ? "bg-blue-50 border-blue-200" 
            : "bg-gray-50 border-gray-200"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              highTraffic ? "bg-amber-200" : "bg-blue-100"
            }`}>
              <Truck className={`w-4 h-4 ${highTraffic ? "text-amber-700" : "text-blue-600"}`} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">민간 구급차 이송 현황</h4>
              <p className="text-[10px] text-muted-foreground">Private Ambulances En Route</p>
            </div>
          </div>
          {highTraffic && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-amber-200 rounded-full"
            >
              <AlertTriangle className="w-3 h-3 text-amber-700" />
              <span className="text-[10px] font-bold text-amber-700">혼잡 주의</span>
            </motion.div>
          )}
        </div>

        {/* Traffic Counter */}
        <div className="flex items-center justify-center gap-4 py-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">🚑</span>
              <span className={`text-4xl font-bold ${
                highTraffic ? "text-amber-600" : trafficCount > 0 ? "text-blue-600" : "text-gray-400"
              }`}>
                {trafficCount}
              </span>
            </div>
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
          ? "bg-red-50 border-red-300" 
          : adjustedBeds <= 2 
            ? "bg-amber-50 border-amber-200" 
            : "bg-emerald-50 border-emerald-200"
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className={`w-4 h-4 ${
            isFull ? "text-red-600" : adjustedBeds <= 2 ? "text-amber-600" : "text-emerald-600"
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
          <div className="text-center px-3 py-2 bg-white rounded-lg shadow-sm">
            <p className="text-lg font-bold text-gray-700">{officialBeds}</p>
            <p className="text-[9px] text-muted-foreground">공식 병상</p>
          </div>
          <span className="text-xl font-bold text-gray-400">−</span>
          <div className="text-center px-3 py-2 bg-white rounded-lg shadow-sm">
            <p className="text-lg font-bold text-blue-600">{trafficCount}</p>
            <p className="text-[9px] text-muted-foreground">이송 중</p>
          </div>
          <span className="text-xl font-bold text-gray-400">=</span>
          <div className={`text-center px-4 py-2 rounded-lg shadow-sm ${
            isFull 
              ? "bg-red-100" 
              : adjustedBeds <= 2 
                ? "bg-amber-100" 
                : "bg-emerald-100"
          }`}>
            <p className={`text-2xl font-bold ${
              isFull 
                ? "text-red-600" 
                : adjustedBeds <= 2 
                  ? "text-amber-600" 
                  : "text-emerald-600"
            }`}>
              {adjustedBeds}
            </p>
            <p className="text-[9px] text-muted-foreground">추정 가용</p>
          </div>
        </div>

        {isFull && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 bg-red-100 rounded-lg text-center"
          >
            <p className="text-xs font-semibold text-red-700">
              ⚠️ 추정 만실 - 다른 병원을 고려해주세요
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default IncomingTrafficCard;
