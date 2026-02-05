import { useMemo } from "react";
import { TrendingUp, AlertTriangle, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

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
}

const calculateScore = (estimatedBeds: number): ScoreData => {
  // 혼잡도: 높을수록 혼잡함 (병상이 적을수록 혼잡도 높음)
  if (estimatedBeds > 5) {
    return {
      score: 20,
      label: "원활",
      status: "smooth",
      message: "현재 병원 혼잡도가 낮습니다",
    };
  } else if (estimatedBeds >= 2 && estimatedBeds <= 5) {
    return {
      score: 55,
      label: "보통",
      status: "moderate",
      message: "도착 전 전화 확인을 권장합니다",
    };
  } else {
    return {
      score: 85,
      label: "혼잡",
      status: "congested",
      message: "다른 병원도 함께 확인해보세요",
    };
  }
};

const CongestionForecast = ({ hospitalId, officialBeds }: CongestionForecastProps) => {
  const ambulancesEnRoute = useMemo(() => getMockAmbulancesEnRoute(hospitalId), [hospitalId]);
  const estimatedBeds = Math.max(0, officialBeds - ambulancesEnRoute);
  const scoreData = useMemo(() => calculateScore(estimatedBeds), [estimatedBeds]);

  const getStatusConfig = () => {
    switch (scoreData.status) {
      case "smooth":
        return {
          gradient: "from-emerald-500 to-green-400",
          bgGlow: "bg-emerald-500/20",
          text: "text-emerald-600 dark:text-emerald-400",
          icon: TrendingUp,
          ringColor: "ring-emerald-500/30",
        };
      case "moderate":
        return {
          gradient: "from-amber-500 to-yellow-400",
          bgGlow: "bg-amber-500/20",
          text: "text-amber-600 dark:text-amber-400",
          icon: AlertTriangle,
          ringColor: "ring-amber-500/30",
        };
      case "congested":
        return {
          gradient: "from-red-500 to-orange-400",
          bgGlow: "bg-red-500/20",
          text: "text-red-600 dark:text-red-400",
          icon: TrendingDown,
          ringColor: "ring-red-500/30",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Calculate rotation for gauge needle (0% = -90deg, 100% = 90deg)
  const needleRotation = (scoreData.score / 100) * 180 - 90;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg">
      {/* Decorative background elements */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full ${config.bgGlow} blur-3xl`} />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="mb-4">
          <h4 className="text-sm font-bold text-foreground">병원 혼잡도 예측</h4>
          <p className="text-[10px] text-muted-foreground">Congestion Forecast</p>
        </div>

        {/* Main Score Display */}
        <div className="flex items-center justify-between mb-4">
          {/* Circular Gauge */}
          <div className="relative w-28 h-16">
            {/* Gauge background arc */}
            <svg viewBox="0 0 100 60" className="w-full h-full">
              {/* Background arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Colored arc based on score */}
              <motion.path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: scoreData.score / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center score */}
            <div className="absolute inset-0 flex items-end justify-center pb-1">
              <motion.span 
                className="text-2xl font-black"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                {scoreData.score}
              </motion.span>
              <span className="text-sm font-medium text-muted-foreground ml-0.5 mb-0.5">%</span>
            </div>
          </div>

          {/* Status Badge */}
          <motion.div 
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ring-2 ${config.ringColor} bg-white/50`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Icon className={`w-6 h-6 ${config.text}`} />
            <span className={`text-lg font-bold ${config.text}`}>{scoreData.label}</span>
          </motion.div>
        </div>

        {/* Status Message */}
        <motion.div 
          className={`p-3 rounded-xl bg-gradient-to-r ${
            scoreData.status === "smooth" 
              ? "from-emerald-50 to-green-50 border border-emerald-200/50" 
              : scoreData.status === "moderate" 
              ? "from-amber-50 to-yellow-50 border border-amber-200/50" 
              : "from-red-50 to-orange-50 border border-red-200/50"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className={`text-xs font-semibold ${config.text} text-center`}>
            💡 {scoreData.message}
          </p>
        </motion.div>

        {/* Disclaimer */}
        <p className="text-[9px] text-muted-foreground/70 text-center mt-3 leading-relaxed">
          * 이 수치는 사설 구급차 이동 현황 기반의 예측값이며, 실제 병원 상황과 다를 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default CongestionForecast;
