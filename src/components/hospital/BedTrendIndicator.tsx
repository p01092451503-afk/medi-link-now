import { TrendingDown, Minus, TrendingUp, Info, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BedTrendIndicatorProps {
  hospitalId: string;
}

// Mock function to simulate bed trend analysis
const getMockBedTrend = (hospitalId: string): { trend: number; label: string; status: "depleting" | "stable" | "increasing" } => {
  // Use hospital ID to generate consistent mock data
  const hash = hospitalId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const trendValue = (hash % 7) - 3; // Range: -3 to +3
  
  if (trendValue <= -2) {
    return { trend: trendValue, label: "급감 중", status: "depleting" };
  } else if (trendValue >= 2) {
    return { trend: trendValue, label: "증가 중", status: "increasing" };
  }
  return { trend: trendValue, label: "안정", status: "stable" };
};

const BedTrendIndicator = ({ hospitalId }: BedTrendIndicatorProps) => {
  const { trend, label, status } = getMockBedTrend(hospitalId);

  const getStatusStyles = () => {
    switch (status) {
      case "depleting":
        return {
          gradient: "from-red-500 to-orange-500",
          bg: "bg-gradient-to-r from-red-50 to-orange-50",
          text: "text-red-700",
          border: "border-red-200/50",
          icon: TrendingDown,
          glow: "shadow-red-500/20",
        };
      case "increasing":
        return {
          gradient: "from-emerald-500 to-green-500",
          bg: "bg-gradient-to-r from-emerald-50 to-green-50",
          text: "text-emerald-700",
          border: "border-emerald-200/50",
          icon: TrendingUp,
          glow: "shadow-emerald-500/20",
        };
      default:
        return {
          gradient: "from-slate-400 to-gray-400",
          bg: "bg-gradient-to-r from-slate-50 to-gray-50",
          text: "text-slate-600",
          border: "border-slate-200/50",
          icon: Minus,
          glow: "shadow-slate-500/20",
        };
    }
  };

  const styles = getStatusStyles();
  const Icon = styles.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${styles.bg} ${styles.text} ${styles.border} cursor-help shadow-lg ${styles.glow}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${styles.gradient} flex items-center justify-center`}>
              <Icon className="w-3 h-3 text-white" />
            </div>
            <span>{label}</span>
            <span className="text-[10px] opacity-70 font-mono">
              ({trend > 0 ? "+" : ""}{trend}/h)
            </span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs font-bold">AI 병상 트렌드 분석</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            최근 1시간 동안의 병상 가용률 변화를 분석한 예측 지표입니다.
            <span className={`ml-1 font-semibold ${styles.text}`}>
              {status === "depleting" && "병상이 빠르게 감소하고 있습니다."}
              {status === "increasing" && "병상 여유가 늘어나고 있습니다."}
              {status === "stable" && "현재 안정적인 상태입니다."}
            </span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BedTrendIndicator;
