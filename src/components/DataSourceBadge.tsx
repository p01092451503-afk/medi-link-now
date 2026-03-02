import { useState } from "react";
import { Shield, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";

type DataSource = "realtime" | "cache" | "mock";

interface DataSourceBadgeProps {
  source: DataSource;
  lastUpdated: Date | null;
  lastApiRefresh: Date | null;
}

const DataSourceBadge = ({ source, lastUpdated, lastApiRefresh }: DataSourceBadgeProps) => {
  const [showModal, setShowModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const getMinutesAgo = (date: Date | null): number | null => {
    if (!date) return null;
    return Math.floor((Date.now() - date.getTime()) / 60000);
  };

  const apiMinutes = getMinutesAgo(lastApiRefresh);
  const cacheMinutes = getMinutesAgo(lastUpdated);

  const getConfig = () => {
    if (source === "mock") {
      return {
        dot: "bg-destructive",
        bg: "bg-white/90 border-destructive/30 shadow-lg",
        text: "text-destructive",
        label: "샘플 데이터 표시 중",
        fullLabel: "⚠️ 샘플 데이터 표시 중",
        isMock: true,
      };
    }

    if (source === "cache" || (cacheMinutes !== null && cacheMinutes > 20)) {
      return {
        dot: "bg-warning",
        bg: "bg-white/90 border-warning/30 shadow-lg",
        text: "text-warning",
        label: `캐시 · ${cacheMinutes ?? "?"}분 전`,
        fullLabel: `캐시 데이터 사용 중 · ${cacheMinutes ?? "?"}분 전 갱신`,
        isMock: false,
      };
    }

    return {
      dot: "bg-success animate-pulse",
      bg: "bg-white/90 border-muted shadow-lg",
      text: "text-muted-foreground",
      label: `${apiMinutes ?? 0}분 전`,
      fullLabel: `Powered by NEDIS & 119 Data · ${apiMinutes ?? 0}분 전 갱신`,
      isMock: false,
    };
  };

  const config = getConfig();

  const handleClick = () => {
    if (config.isMock) {
      setShowModal(true);
    } else {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium border backdrop-blur-sm transition-all ${config.bg} ${config.text} cursor-pointer hover:shadow-xl active:scale-95`}
      >
        <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.span
              key="full"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-primary shrink-0" />
              {config.fullLabel}
            </motion.span>
          ) : (
            <motion.span
              key="short"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-primary shrink-0" />
              {config.isMock ? config.label : config.label}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">⚠️ 샘플 데이터 안내</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed pt-2">
              현재 공공 API 연결이 원활하지 않아 사전 등록된 샘플 데이터를 표시하고 있습니다.
              <br /><br />
              실제 병상 현황은 각 병원에 직접 확인하세요.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DataSourceBadge;
