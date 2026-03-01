import { useState, useEffect } from "react";
import { Activity, AlertTriangle, WifiOff } from "lucide-react";

interface DataFreshnessTimerProps {
  lastUpdated: Date | null;
  isLoading?: boolean;
  source?: string;
}

type FreshnessLevel = 'live' | 'recent' | 'stale' | 'critical';

const DataFreshnessTimer = ({ lastUpdated, isLoading, source }: DataFreshnessTimerProps) => {
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

  const getLevel = (): FreshnessLevel => {
    if (secondsAgo >= 600) return 'critical';   // 10분+
    if (secondsAgo >= 180) return 'stale';       // 3분+
    if (secondsAgo >= 30) return 'recent';       // 30초+
    return 'live';
  };

  const getDisplayText = () => {
    if (isLoading) return "로딩 중...";
    if (!lastUpdated) return "연결 중...";
    if (secondsAgo < 10) return "방금 전";
    if (secondsAgo < 60) return `${secondsAgo}초 전`;
    const minutes = Math.floor(secondsAgo / 60);
    if (minutes < 60) return `${minutes}분 전`;
    return `${Math.floor(minutes / 60)}시간 전`;
  };

  const level = getLevel();

  const levelStyles: Record<FreshnessLevel, { iconBg: string; iconColor: string; textColor: string; dotColor: string; badgeBg: string; badgeText: string; label: string }> = {
    live: {
      iconBg: "bg-accent",
      iconColor: "text-primary",
      textColor: "text-foreground",
      dotColor: "bg-success animate-pulse",
      badgeBg: "bg-success/10",
      badgeText: "text-success",
      label: "실시간",
    },
    recent: {
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      textColor: "text-foreground",
      dotColor: "bg-success",
      badgeBg: "bg-muted",
      badgeText: "text-muted-foreground",
      label: "최근 업데이트",
    },
    stale: {
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      textColor: "text-warning",
      dotColor: "bg-warning animate-pulse",
      badgeBg: "bg-warning/10",
      badgeText: "text-warning",
      label: "⚠️ 데이터 지연",
    },
    critical: {
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      textColor: "text-destructive",
      dotColor: "bg-destructive animate-pulse",
      badgeBg: "bg-destructive/10",
      badgeText: "text-destructive",
      label: "🔴 데이터 지연",
    },
  };

  const s = levelStyles[level];
  const Icon = level === 'critical' ? WifiOff : level === 'stale' ? AlertTriangle : Activity;

  return (
    <div className="flex flex-col items-center gap-3 group cursor-pointer">
      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm border border-border transition-all duration-300 group-hover:scale-105 ${s.iconBg}`}>
        <Icon className={`w-7 h-7 transition-all duration-300 group-hover:scale-110 ${s.iconColor}`} />
      </div>
      <div className="text-center">
        <p className={`text-lg font-bold tracking-tight ${s.textColor}`}>
          {getDisplayText()}
        </p>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${s.badgeBg} ${s.badgeText}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dotColor}`} />
          {s.label}
        </span>
        {source && (
          <p className="text-[9px] text-muted-foreground mt-0.5">
            소스: {source === 'api' ? '공공API' : source === 'cache' ? '캐시' : source === 'db' ? 'DB' : '샘플'}
          </p>
        )}
      </div>
    </div>
  );
};

export default DataFreshnessTimer;
