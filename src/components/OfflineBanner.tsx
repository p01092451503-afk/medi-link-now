import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OfflineBannerProps {
  isQueryError?: boolean;
  onRetry?: () => void;
}

const OfflineBanner = ({ isQueryError, onRetry }: OfflineBannerProps) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  const showBanner = isOffline || isQueryError;

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
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <WifiOff className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">
                인터넷 연결 확인 필요
              </p>
              <p className="text-xs text-white/80 truncate">
                마지막 저장된 정보를 표시합니다
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
