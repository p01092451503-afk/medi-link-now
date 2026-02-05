import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, CloudOff, Check, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CloudSyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastSyncTime?: Date;
  itemCount: number;
  isLoading: boolean;
  onRefresh: () => void;
}

const CloudSyncStatusModal = ({
  isOpen,
  onClose,
  lastSyncTime,
  itemCount,
  isLoading,
  onRefresh,
}: CloudSyncStatusModalProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!lastSyncTime) return;

    const updateElapsed = () => {
      const diff = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
      setElapsed(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  const formatElapsed = (seconds: number) => {
    if (seconds < 60) return `${seconds}초 전`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    return `${Math.floor(seconds / 3600)}시간 전`;
  };

  const isStale = elapsed > 60;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">클라우드 동기화 상태</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Status Icon */}
          <div className="flex flex-col items-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
              isStale ? "bg-yellow-100" : "bg-green-100"
            }`}>
              {isLoading ? (
                <RefreshCw className="w-10 h-10 text-primary animate-spin" />
              ) : isStale ? (
                <CloudOff className="w-10 h-10 text-yellow-600" />
              ) : (
                <Cloud className="w-10 h-10 text-green-600" />
              )}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              isStale ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
            }`}>
              {!isStale && <Check className="w-4 h-4" />}
              {isStale ? "동기화 필요" : "동기화됨"}
            </div>
          </div>

          {/* Info Grid */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-muted-foreground">저장된 가족 수</span>
              <span className="font-medium">{itemCount}명</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-muted-foreground">마지막 동기화</span>
              <span className={`font-medium ${isStale ? "text-yellow-600" : "text-green-600"}`}>
                {lastSyncTime ? formatElapsed(elapsed) : "없음"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">저장 위치</span>
              <span className="font-medium text-primary">☁️ Lovable Cloud</span>
            </div>
          </div>

          {/* Refresh Button */}
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-full rounded-xl"
            variant={isStale ? "default" : "outline"}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "동기화 중..." : "지금 동기화"}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            가족 정보는 자동으로 클라우드에 저장됩니다
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CloudSyncStatusModal;
