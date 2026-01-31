import { useMemo } from "react";
import { TrendingUp, AlertTriangle, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CongestionForecastProps {
  hospitalId: string;
  officialBeds: number;
}

// Mock function to get ambulances en route (same logic as ShadowDemandCard)
const getMockAmbulancesEnRoute = (hospitalId: string): number => {
  const hash = hospitalId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 4; // 0-3 ambulances
};

interface ScoreData {
  score: number;
  label: string;
  status: "smooth" | "moderate" | "congested";
  message: string;
  emoji: string;
}

const calculateScore = (estimatedBeds: number): ScoreData => {
  if (estimatedBeds > 5) {
    return {
      score: 95,
      label: "원활",
      status: "smooth",
      message: "현재 병원 혼잡도가 낮습니다",
      emoji: "🟢",
    };
  } else if (estimatedBeds >= 2 && estimatedBeds <= 5) {
    return {
      score: 70,
      label: "보통",
      status: "moderate",
      message: "도착 전 전화 확인을 권장합니다",
      emoji: "🟡",
    };
  } else {
    return {
      score: 30,
      label: "혼잡",
      status: "congested",
      message: "다른 병원도 함께 확인해보세요",
      emoji: "🔴",
    };
  }
};

const CongestionForecast = ({ hospitalId, officialBeds }: CongestionForecastProps) => {
  const ambulancesEnRoute = useMemo(() => getMockAmbulancesEnRoute(hospitalId), [hospitalId]);
  const estimatedBeds = Math.max(0, officialBeds - ambulancesEnRoute);
  const scoreData = useMemo(() => calculateScore(estimatedBeds), [estimatedBeds]);

  const getStatusStyles = () => {
    switch (scoreData.status) {
      case "smooth":
        return {
          bg: "from-green-50 to-emerald-50",
          border: "border-green-200",
          progressBg: "bg-green-100",
          progressFill: "[&>div]:bg-green-500",
          text: "text-green-700",
          iconBg: "bg-green-100",
          icon: TrendingUp,
        };
      case "moderate":
        return {
          bg: "from-yellow-50 to-amber-50",
          border: "border-yellow-200",
          progressBg: "bg-yellow-100",
          progressFill: "[&>div]:bg-yellow-500",
          text: "text-yellow-700",
          iconBg: "bg-yellow-100",
          icon: AlertTriangle,
        };
      case "congested":
        return {
          bg: "from-red-50 to-orange-50",
          border: "border-red-200",
          progressBg: "bg-red-100",
          progressFill: "[&>div]:bg-red-500",
          text: "text-red-700",
          iconBg: "bg-red-100",
          icon: TrendingDown,
        };
    }
  };

  const styles = getStatusStyles();
  const Icon = styles.icon;

  return (
    <div className={`bg-gradient-to-br ${styles.bg} rounded-xl p-4 border ${styles.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${styles.text}`} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">병원 혼잡도 예측</h4>
            <p className="text-[10px] text-muted-foreground">Congestion Forecast</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold">{scoreData.score}%</span>
            <span className="text-lg">{scoreData.emoji}</span>
          </div>
          <p className={`text-xs font-medium ${styles.text}`}>{scoreData.label}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <Progress 
          value={scoreData.score} 
          className={`h-3 ${styles.progressBg} ${styles.progressFill}`}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">혼잡</span>
          <span className="text-[10px] text-muted-foreground">원활</span>
        </div>
      </div>

      {/* Dynamic Message */}
      <div className={`p-2.5 rounded-lg ${
        scoreData.status === "smooth" 
          ? "bg-green-100/50" 
          : scoreData.status === "moderate" 
          ? "bg-yellow-100/50" 
          : "bg-red-100/50"
      }`}>
        <p className={`text-xs font-medium ${styles.text} text-center`}>
          {scoreData.message}
        </p>
      </div>

      {/* AI Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center mt-2 opacity-70 leading-relaxed">
        * 이 수치는 사설 구급차 이동 현황 기반의 예측값이며, 실제 병원 상황과 다를 수 있습니다.
      </p>
    </div>
  );
};

export default CongestionForecast;
