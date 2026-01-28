import { TrendingDown, Minus, TrendingUp, Info } from "lucide-react";
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
          bg: "bg-red-100",
          text: "text-red-700",
          border: "border-red-200",
          icon: TrendingDown,
          emoji: "📉",
        };
      case "increasing":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          border: "border-green-200",
          icon: TrendingUp,
          emoji: "📈",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          border: "border-gray-200",
          icon: Minus,
          emoji: "➖",
        };
    }
  };

  const styles = getStatusStyles();
  const Icon = styles.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles.bg} ${styles.text} ${styles.border} cursor-help`}
          >
            <span>{styles.emoji}</span>
            <Icon className="w-3 h-3" />
            <span>{label}</span>
            <span className="text-[10px] opacity-70">
              ({trend > 0 ? "+" : ""}{trend}/hr)
            </span>
            <Info className="w-3 h-3 opacity-50" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <p className="text-xs font-medium mb-1">AI 병상 트렌드 분석</p>
          <p className="text-xs text-muted-foreground">
            최근 1시간 동안의 병상 가용률 변화를 분석한 예측 지표입니다.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BedTrendIndicator;
