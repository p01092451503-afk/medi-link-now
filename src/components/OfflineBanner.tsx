import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OfflineBannerProps {
  isQueryError?: boolean;
  onRetry?: () => void;
  lastUpdated?: Date | null;
}

type StalenessLevel = "fresh" | "warning" | "critical";

const OfflineBanner = ({ isQueryError, onRetry, lastUpdated }: OfflineBannerProps) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [minutesAgo, setMinutesAgo] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => {
      setMinutesAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 60000));
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const showBanner = isOffline || isQueryError;

  const getStaleness = (): StalenessLevel => {
    if (minutesAgo >= 30) return "critical";
    if (minutesAgo >= 5) return "warning";
    return "fresh";
  };

  const staleness = getStaleness();

  const config: Record<StalenessLevel, { gradient: string; shadow: string; title: string; subtitle: string; Icon: typeof WifiOff }> = {
    fresh: {
      gradient: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/30",
      title: "인터넷 연결 확인 필요",
      subtitle: lastUpdated
        ? `마지막 업데이트: ${minutesAgo}분 전 (오프라인)`
        : "마지막 저장된 정보를 표시합니다",
      Icon: WifiOff,
    },
    warning: {
      gradient: "from-orange-500 to-red-400",
      shadow: "shadow-orange-500/30",
      title: "⚠️ 데이터가 오래되었습니다",
      subtitle: `마지막 업데이트: ${minutesAgo}분 전 — 실제 현황과 다를 수 있습니다`,
      Icon: AlertTriangle,
    },
    critical: {
      gradient: "from-red-600 to-red-500",
      shadow: "shadow-red-500/40",
      title: "🔴 실시간 데이터가 아닙니다",
      subtitle: "119에 직접 문의하세요",
      Icon: Clock,
    },
  };

  const c = config[staleness];
  const { Icon } = c;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0 left-0 right-0 z-[1000] mx-4 mt-4"
        >
          <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${c.gradient} rounded-xl shadow-lg ${c.shadow}`}>
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">
                {c.title}
              </p>
              <p className="text-xs text-white/80 truncate">
                {c.subtitle}
              </p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="다시 시도"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
