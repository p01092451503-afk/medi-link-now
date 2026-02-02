import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Radio, Ban } from "lucide-react";
import { useSharedRejectionLogs, SHARED_REJECTION_REASONS } from "@/hooks/useSharedRejectionLogs";
import { cleanHospitalName } from "@/lib/utils";

// Helper function to format time ago in Korean
const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${Math.floor(diffHours / 24)}일 전`;
};

// Get reason label from reason id
const getReasonLabel = (reasonId: string): string => {
  const reason = SHARED_REJECTION_REASONS.find(r => r.id === reasonId);
  return reason?.label || reasonId;
};

const RejectionTickerFeed = () => {
  const { logs, isLoading } = useSharedRejectionLogs();

  // Get only recent logs (last 30 mins) for the ticker
  const recentLogs = useMemo(() => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return logs
      .filter(log => new Date(log.recorded_at) >= thirtyMinutesAgo)
      .slice(0, 5);
  }, [logs]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 border border-red-100">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-red-100 animate-pulse" />
          <div className="h-4 w-32 bg-red-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (recentLogs.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-green-600" />
          </div>
          <p className="text-sm text-green-700">
            <span className="font-medium">실시간 제보:</span>{" "}
            <span className="text-green-600">최근 30분 내 거부 이력 없음 ✅</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 border border-red-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        </div>
        <p className="text-sm font-semibold text-red-700">
          🚨 동료 대원 제보 ({recentLogs.length}건)
        </p>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-red-500 font-medium">LIVE</span>
        </div>
      </div>

      {/* Ticker Feed */}
      <div className="space-y-2 max-h-[120px] overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {recentLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-2 p-2 bg-white/70 rounded-lg border border-red-100/50"
            >
              <Ban className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="text-red-600 font-semibold">{formatTimeAgo(log.recorded_at)}</span>
                  {" · "}
                  <span className="font-medium text-gray-900 truncate">{cleanHospitalName(log.hospital_name)}</span>
                  {" "}
                  <span className="text-orange-600">[{getReasonLabel(log.rejection_reason)}]</span>
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Info text */}
      <p className="text-[10px] text-red-400 mt-2 text-center">
        제보는 60분 후 자동으로 사라집니다
      </p>
    </div>
  );
};

export default RejectionTickerFeed;
