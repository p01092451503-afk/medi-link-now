import { useMemo } from "react";
import { Clock } from "lucide-react";
import { fire119HospitalStats } from "@/data/fire119Stats";
import { useLiveHospitalStatus, LiveStatusLevel } from "@/hooks/useLiveHospitalStatus";

interface WaitTimePredictionProps {
  hospitalId: number;
  totalBeds?: number;
  hospitalName?: string;
}

// ── Time-of-day multiplier for wait time ──
const getTimeOfDayWaitMultiplier = (): number => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) return 1.4;   // late night: long stays
  if (hour >= 6 && hour < 9) return 1.1;
  if (hour >= 9 && hour < 17) return 1.15;  // daytime: steady flow
  if (hour >= 17 && hour < 22) return 1.35; // evening rush
  return 1.4;                                // late evening
};

// ── 119 transfer volume multiplier ──
const get119WaitMultiplier = (hospitalName?: string): number => {
  if (!hospitalName) return 1.0;
  const normalized = hospitalName.replace(/\s/g, "");
  const matched = fire119HospitalStats.find(stat => {
    const statName = stat.hospitalName.replace(/\s/g, "");
    return normalized.includes(statName) || statName.includes(normalized);
  });
  if (!matched) return 1.0;
  if (matched.ranking <= 2) return 1.5;
  if (matched.ranking <= 5) return 1.3;
  return 1.15;
};

// ── Live report override ──
const getLiveReportWaitHours = (status: LiveStatusLevel | null): number | null => {
  if (!status) return null;
  switch (status) {
    case "available": return 15 / 60;  // ~15min
    case "busy": return 1.5;           // ~1.5h
    case "full": return 3.5;           // ~3.5h
  }
};

// Base wait estimate from bed count (percentage-aware for large hospitals)
const estimateBaseWaitHours = (hospitalId: number, totalBeds: number): number => {
  if (totalBeds >= 30) {
    return hospitalId % 2 === 0 ? 15 / 60 : 25 / 60;
  }
  if (totalBeds >= 15) {
    const options = [20 / 60, 30 / 60, 40 / 60];
    return options[hospitalId % options.length];
  }
  if (totalBeds >= 8) {
    const options = [30 / 60, 45 / 60, 1.0];
    return options[hospitalId % options.length];
  }
  if (totalBeds >= 4) {
    const options = [0.75, 1.0, 1.5];
    return options[hospitalId % options.length];
  }
  if (totalBeds >= 1) {
    const options = [1.5, 2.0, 2.5];
    return options[hospitalId % options.length];
  }
  const options = [3.0, 3.5, 4.0];
  return options[hospitalId % options.length];
};

const getWaitTimeConfig = (hours: number) => {
  if (hours < 0.75) {
    return {
      label: "빠름",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/50",
      border: "border-green-200 dark:border-green-800",
      icon: "text-green-500",
    };
  }
  if (hours <= 2) {
    return {
      label: "보통",
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950/50",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: "text-yellow-500",
    };
  }
  return {
    label: "혼잡",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-500",
  };
};

const WaitTimePrediction = ({ hospitalId, totalBeds = 0, hospitalName }: WaitTimePredictionProps) => {
  const liveStatus = useLiveHospitalStatus(hospitalId);

  const waitHours = useMemo(() => {
    // Priority 1: Live report
    const liveWait = getLiveReportWaitHours(liveStatus.status);
    if (liveWait !== null) return liveWait;

    // Priority 2: Corrected estimation
    let base = estimateBaseWaitHours(hospitalId, totalBeds);
    base *= getTimeOfDayWaitMultiplier();
    base *= get119WaitMultiplier(hospitalName);
    return Math.min(base, 5); // cap at 5 hours
  }, [hospitalId, totalBeds, hospitalName, liveStatus.status]);

  const config = getWaitTimeConfig(waitHours);

  const displayTime = waitHours < 1
    ? `약 ${Math.max(5, Math.round(waitHours * 60))}분`
    : waitHours < 2
    ? `약 ${Math.round(waitHours * 60)}분`
    : `약 ${waitHours.toFixed(1)}시간`;

  return (
    <div className={`p-3 rounded-xl ${config.bg} border ${config.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${config.icon}`} />
          <span className="text-xs font-medium text-muted-foreground">예상 대기시간</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>
      <p className={`text-lg font-bold mt-1 ${config.color}`}>
        {displayTime}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        ※ AI 예측 기반 추정치 (실시간 변동 가능)
      </p>
    </div>
  );
};

export default WaitTimePrediction;
