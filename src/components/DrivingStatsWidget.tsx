import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Navigation, Calendar, Clock } from "lucide-react";
import type { DrivingLog } from "./DrivingLogWidget";

interface DrivingStatsWidgetProps {
  logs: DrivingLog[];
}

const DrivingStatsWidget = ({ logs }: DrivingStatsWidgetProps) => {
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString("ko-KR");
    
    // Get start of week (Monday)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const todayLogs = logs.filter(log => log.date === todayStr);
    const weekLogs = logs.filter(log => {
      // Parse Korean date format (YYYY. M. D.)
      const parts = log.date.split(". ").map(p => parseInt(p.replace(".", "")));
      if (parts.length < 3) return false;
      const logDate = new Date(parts[0], parts[1] - 1, parts[2]);
      return logDate >= startOfWeek && logDate <= now;
    });

    const todayTrips = todayLogs.length;
    const todayDistance = todayLogs.reduce((sum, log) => sum + log.distance, 0);
    const weekTrips = weekLogs.length;
    const weekDistance = weekLogs.reduce((sum, log) => sum + log.distance, 0);

    // Average per day (for week)
    const daysElapsed = Math.max(1, diff + 1);
    const avgTripsPerDay = weekTrips / daysElapsed;
    const avgDistancePerDay = weekDistance / daysElapsed;

    return {
      todayTrips,
      todayDistance: Math.round(todayDistance * 10) / 10,
      weekTrips,
      weekDistance: Math.round(weekDistance * 10) / 10,
      avgTripsPerDay: Math.round(avgTripsPerDay * 10) / 10,
      avgDistancePerDay: Math.round(avgDistancePerDay * 10) / 10,
    };
  }, [logs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-foreground" />
        </div>
        <h3 className="font-bold text-foreground tracking-tight">운행 통계 요약</h3>
      </div>

      {/* Today & Week Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-secondary rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Calendar className="w-3 h-3" />
            오늘
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{stats.todayTrips}</span>
            <span className="text-sm text-muted-foreground">건</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Navigation className="w-3 h-3" />
            <span>{stats.todayDistance} km</span>
          </div>
        </div>

        <div className="bg-secondary rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Clock className="w-3 h-3" />
            이번 주
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{stats.weekTrips}</span>
            <span className="text-sm text-muted-foreground">건</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Navigation className="w-3 h-3" />
            <span>{stats.weekDistance} km</span>
          </div>
        </div>
      </div>

      {/* Average Stats */}
      <div className="bg-secondary rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-foreground" />
          <span className="text-sm text-muted-foreground">일 평균</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-sm font-semibold text-foreground">{stats.avgTripsPerDay}</span>
            <span className="text-xs text-muted-foreground ml-1">건</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="text-right">
            <span className="text-sm font-semibold text-foreground">{stats.avgDistancePerDay}</span>
            <span className="text-xs text-muted-foreground ml-1">km</span>
          </div>
        </div>
      </div>

      {logs.length === 0 && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          운행 기록이 없습니다. 운행을 시작해보세요!
        </p>
      )}
    </motion.div>
  );
};

export default DrivingStatsWidget;
