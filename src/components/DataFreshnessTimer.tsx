import { useState, useEffect } from "react";
import { Activity } from "lucide-react";

interface DataFreshnessTimerProps {
  lastUpdated: Date | null;
  isLoading?: boolean;
}

const DataFreshnessTimer = ({ lastUpdated, isLoading }: DataFreshnessTimerProps) => {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!lastUpdated) return;

    const updateTimer = () => {
      const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setSecondsAgo(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const getDisplayText = () => {
    if (isLoading) return "로딩 중...";
    if (!lastUpdated) return "연결 중...";
    
    if (secondsAgo < 60) {
      return `${secondsAgo}초 전`;
    } else {
      const minutes = Math.floor(secondsAgo / 60);
      return `${minutes}분 전`;
    }
  };

  const isStale = secondsAgo >= 60;

  return (
    <div className="flex flex-col items-center gap-3 group cursor-pointer">
      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg border transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl ${
        isStale 
          ? "bg-gradient-to-br from-red-100 via-orange-50 to-red-50/50 shadow-red-500/10 border-red-200/50 group-hover:shadow-red-500/20 group-hover:border-red-300/50"
          : "bg-gradient-to-br from-emerald-100 via-green-50 to-emerald-50/50 shadow-green-500/10 border-green-200/50 group-hover:shadow-green-500/20 group-hover:border-green-300/50"
      }`}>
        <Activity className={`w-8 h-8 transition-all duration-300 group-hover:scale-110 ${
          isStale ? "text-red-600" : "text-emerald-600"
        }`} />
      </div>
      <div className="text-center">
        <p className={`text-lg font-bold tracking-tight ${
          isStale ? "text-red-600" : "text-foreground"
        }`}>
          {getDisplayText()}
        </p>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold mt-1 ${
          isStale 
            ? "bg-red-100 text-red-600" 
            : "bg-green-100 text-green-700"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isStale ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
          {isStale ? "데이터 지연됨" : "실시간 업데이트"}
        </span>
      </div>
    </div>
  );
};

export default DataFreshnessTimer;
