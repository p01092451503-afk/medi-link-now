import { useMemo } from "react";
import { TrendingUp, AlertTriangle, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { fire119HospitalStats } from "@/data/fire119Stats";
import { useLiveHospitalStatus } from "@/hooks/useLiveHospitalStatus";
import { LiveStatusLevel } from "@/hooks/useLiveHospitalStatus";

interface CongestionForecastProps {
  hospitalId: string;
  officialBeds: number;
  hospitalName?: string;
  hospitalNumericId?: number;
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

// ── Factor 1: Time-of-day correction ──
// Large ERs stay busy even at night; peaks in evening/late night
const getTimeOfDayCorrectionFactor = (): number => {
  const hour = new Date().getHours();
  // 0-5: late night – still busy in big hospitals
  if (hour >= 0 && hour < 6) return 1.4;
  // 6-8: early morning – moderate
  if (hour >= 6 && hour < 9) return 1.1;
  // 9-16: daytime – standard
  if (hour >= 9 && hour < 17) return 1.0;
  // 17-21: evening rush – high
  if (hour >= 17 && hour < 22) return 1.3;
  // 22-24: late evening – high (trauma/drunk injuries)
  return 1.35;
};

// ── Factor 2: 119 transfer volume correction ──
// Hospitals with high 119 transfer volumes are inherently busier
const get119TransferCorrectionFactor = (hospitalName?: string): number => {
  if (!hospitalName) return 1.0;
  const normalized = hospitalName.replace(/\s/g, "");
  const matched = fire119HospitalStats.find(stat => {
    const statName = stat.hospitalName.replace(/\s/g, "");
    return normalized.includes(statName) || statName.includes(normalized);
  });
  if (!matched) return 1.0;
  // TOP 1-2: very high baseline congestion
  if (matched.ranking <= 2) return 1.5;
  // TOP 3-5: high baseline
  if (matched.ranking <= 5) return 1.3;
  // TOP 6-10: moderate baseline
  return 1.15;
};

// ── Factor 3: Live report override ──
// If crowdsourced report exists, heavily weight it
const getLiveReportScore = (liveStatus: LiveStatusLevel | null): number | null => {
  if (!liveStatus) return null;
  switch (liveStatus) {
    case "available": return 15;
    case "busy": return 60;
    case "full": return 90;
  }
};

// ── Factor 4: Percentage-based bed threshold ──
// For large hospitals (50+ beds), absolute count of 5 is meaningless
// Use occupancy rate instead
const calculateBaseScore = (estimatedBeds: number, officialBeds: number): number => {
  if (officialBeds <= 0) return 90;
  
  // Calculate availability ratio
  const availabilityRatio = estimatedBeds / officialBeds;
  
  // Large hospitals (20+ official beds): use percentage
  if (officialBeds >= 20) {
    if (availabilityRatio > 0.5) return 20;      // >50% available → smooth
    if (availabilityRatio > 0.25) return 45;     // 25-50% → moderate-low
    if (availabilityRatio > 0.1) return 65;      // 10-25% → moderate-high
    return 85;                                     // <10% → congested
  }
  
  // Small hospitals: use absolute count (original logic)
  if (estimatedBeds > 5) return 20;
  if (estimatedBeds >= 2) return 55;
  return 85;
};

const getScoreData = (score: number): ScoreData => {
  if (score <= 35) {
    return {
      score: Math.round(score),
      label: "원활",
      status: "smooth",
      message: "현재 병원 혼잡도가 낮습니다",
    };
  } else if (score <= 65) {
    return {
      score: Math.round(score),
      label: "보통",
      status: "moderate",
      message: "도착 전 전화 확인을 권장합니다",
    };
  } else {
    return {
      score: Math.min(95, Math.round(score)),
      label: "혼잡",
      status: "congested",
      message: "다른 병원도 함께 확인해보세요",
    };
  }
};

const CongestionForecast = ({ hospitalId, officialBeds, hospitalName, hospitalNumericId }: CongestionForecastProps) => {
  const ambulancesEnRoute = useMemo(() => getMockAmbulancesEnRoute(hospitalId), [hospitalId]);
  const estimatedBeds = Math.max(0, officialBeds - ambulancesEnRoute);
  const liveStatus = useLiveHospitalStatus(hospitalNumericId);

  const scoreData = useMemo(() => {
    // Check for live report first (highest priority)
    const liveScore = getLiveReportScore(liveStatus.status);
    if (liveScore !== null) {
      return getScoreData(liveScore);
    }

    // Calculate base score from bed availability (percentage-based for large hospitals)
    let score = calculateBaseScore(estimatedBeds, officialBeds);

    // Apply time-of-day correction
    const timeFactor = getTimeOfDayCorrectionFactor();
    score = score * timeFactor;

    // Apply 119 transfer volume correction
    const transferFactor = get119TransferCorrectionFactor(hospitalName);
    score = score * transferFactor;

    // Clamp to 5-95
    score = Math.max(5, Math.min(95, score));
    return getScoreData(score);
  }, [estimatedBeds, officialBeds, hospitalName, liveStatus.status]);

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

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg">
      {/* Decorative background elements */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full ${config.bgGlow} blur-3xl`} />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
      
      <div className="relative p-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">병원 혼잡도 예측</h4>
            {liveStatus.isLive && (
              <span className="text-[9px] font-bold text-background bg-foreground px-1.5 py-0.5 rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </div>
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
                className="stroke-slate-200 dark:stroke-slate-600"
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
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ring-2 ${config.ringColor} bg-white/50 dark:bg-slate-700/50`}
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
              ? "from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 border border-emerald-200/50 dark:border-emerald-800/50" 
              : scoreData.status === "moderate" 
              ? "from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 border border-amber-200/50 dark:border-amber-800/50" 
              : "from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 border border-red-200/50 dark:border-red-800/50"
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
          * 시간대·119 이송량·현장 제보·병상 점유율 기반 종합 예측이며, 실제 상황과 다를 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default CongestionForecast;
