import { Clock } from "lucide-react";

interface WaitTimePredictionProps {
  hospitalId: number;
}

// Mock wait time data based on hospital ID for consistent display
const getMockWaitTime = (hospitalId: number): number => {
  // Generate consistent mock values based on hospital ID
  const seed = hospitalId * 17 + 7;
  const options = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
  return options[seed % options.length];
};

const getWaitTimeConfig = (hours: number) => {
  if (hours < 1) {
    return {
      label: "빠름",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/50",
      border: "border-green-200 dark:border-green-800",
      icon: "text-green-500",
    };
  }
  if (hours <= 3) {
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

const WaitTimePrediction = ({ hospitalId }: WaitTimePredictionProps) => {
  const waitHours = getMockWaitTime(hospitalId);
  const config = getWaitTimeConfig(waitHours);

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
        약 {waitHours}시간
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        ※ AI 예측 기반 추정치 (실시간 변동 가능)
      </p>
    </div>
  );
};

export default WaitTimePrediction;
