import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { isHospital119Verified, getSpecialtyBadgeText, getHospitalBusyHours, HourlyBusyData } from "@/data/fire119Stats";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Fire119VerifiedBadgeProps {
  hospitalName: string;
  hospitalId?: number;
  showChart?: boolean;
}

const BusyHoursChart = ({ data }: { data: HourlyBusyData[] }) => {
  const maxIncidents = Math.max(...data.map(d => d.incidents));
  const currentHour = new Date().getHours();
  
  return (
    <div className="mt-3 p-4 bg-secondary rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-background flex items-center justify-center">
          <BarChart3 className="w-3.5 h-3.5 text-foreground" />
        </div>
        <span className="text-xs font-bold text-foreground tracking-tight">시간대별 119 도착 통계</span>
        <span className="text-[9px] text-muted-foreground ml-auto">3년 평균</span>
      </div>
      
      {/* Mini bar chart */}
      <div className="flex items-end gap-0.5 h-16">
        {data.map((item, idx) => {
          const height = (item.incidents / maxIncidents) * 100;
          const isCurrentHour = item.hour === currentHour;
          
          let barColor = "bg-muted-foreground/20";
          if (item.level === "high") barColor = "bg-foreground";
          else if (item.level === "moderate") barColor = "bg-foreground/50";
          else barColor = "bg-foreground/25";
          
          return (
            <TooltipProvider key={idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`flex-1 rounded-t transition-all cursor-pointer hover:opacity-80 ${barColor} ${
                      isCurrentHour ? "ring-2 ring-foreground ring-offset-1 ring-offset-secondary" : ""
                    }`}
                    style={{ height: `${Math.max(height, 8)}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{item.hour}시</p>
                  <p className="text-muted-foreground">평균 {item.incidents}건/시간</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      
      {/* Time labels */}
      <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground">
        <span>0시</span>
        <span>6시</span>
        <span>12시</span>
        <span>18시</span>
        <span>24시</span>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-foreground/25" />
          <span className="text-[10px] text-muted-foreground">한산</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-foreground/50" />
          <span className="text-[10px] text-muted-foreground">보통</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-foreground" />
          <span className="text-[10px] text-muted-foreground">혼잡</span>
        </div>
      </div>
    </div>
  );
};

const Fire119VerifiedBadge = ({ hospitalName, hospitalId, showChart = true }: Fire119VerifiedBadgeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const verificationResult = isHospital119Verified(hospitalName);
  
  if (!verificationResult.verified) {
    return null;
  }
  
  const specialtyText = verificationResult.specialty 
    ? getSpecialtyBadgeText(verificationResult.specialty)
    : "응급";
  
  const busyHoursData = hospitalId ? getHospitalBusyHours(hospitalId) : null;
  
  return (
    <div className="mb-4">
      {/* Main Badge */}
      <motion.button
        onClick={() => showChart && setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 rounded-2xl bg-secondary border border-border hover:border-foreground/20 transition-all group"
        whileTap={showChart ? { scale: 0.98 } : undefined}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
          <Ambulance className="w-5 h-5 text-background" />
        </div>
        
        {/* Content */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-foreground tracking-tight">119 최다 이송 병원</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold text-foreground bg-foreground/10 rounded-full">
              TOP {verificationResult.ranking}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            소방청 통계 기준 · {specialtyText} 분야 상위 이송
          </p>
        </div>
        
        {/* Expand indicator */}
        {showChart && busyHoursData && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <BarChart3 className="w-4 h-4" />
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        )}
      </motion.button>
      
      {/* Expandable Chart Section */}
      <AnimatePresence>
        {isExpanded && showChart && busyHoursData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <BusyHoursChart data={busyHoursData} />
            
            {/* Disclaimer */}
            <p className="text-[9px] text-center text-muted-foreground mt-2 px-2">
              ※ 본 통계는 과거 119 이송 데이터 분석에 기반한 참고 정보입니다
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Fire119VerifiedBadge;
