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
      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm border transition-all duration-300 group-hover:scale-105 ${
        isStale 
          ? "bg-slate-100 border-slate-200 group-hover:border-slate-300"
          : "bg-slate-100 border-slate-200 group-hover:border-slate-300"
      }`}>
        <Activity className={`w-7 h-7 transition-all duration-300 group-hover:scale-110 ${
          isStale ? "text-slate-400" : "text-slate-600"
        }`} />
      </div>
      <div className="text-center">
        <p className={`text-lg font-bold tracking-tight ${
          isStale ? "text-slate-500" : "text-slate-800"
        }`}>
          {getDisplayText()}
        </p>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
          isStale 
            ? "bg-slate-100 text-slate-500" 
            : "bg-slate-100 text-slate-600"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isStale ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
          {isStale ? "데이터 지연됨" : "실시간"}
        </span>
      </div>
    </div>
  );
};

export default DataFreshnessTimer;
