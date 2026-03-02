import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type DataSource = "realtime" | "cache" | "mock";

interface DataSourceBadgeProps {
  source: DataSource;
  lastUpdated: Date | null;
  lastApiRefresh: Date | null;
}

const DataSourceBadge = ({ source, lastUpdated, lastApiRefresh }: DataSourceBadgeProps) => {
  const [showModal, setShowModal] = useState(false);

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
        bg: "bg-destructive/10 border-destructive/30",
        text: "text-destructive",
        label: "샘플 데이터 표시 중",
        clickable: true,
      };
    }

    if (source === "cache" || (cacheMinutes !== null && cacheMinutes > 20)) {
      return {
        dot: "bg-warning",
        bg: "bg-warning/10 border-warning/30",
        text: "text-warning",
        label: `캐시 데이터 · ${cacheMinutes ?? "?"}분 전`,
        clickable: false,
      };
    }

    return {
      dot: "bg-success animate-pulse",
      bg: "bg-success/10 border-success/30",
      text: "text-success",
      label: `실시간 NEDIS 연동 중${apiMinutes !== null ? ` · ${apiMinutes}분 전 갱신` : ""}`,
      clickable: false,
    };
  };

  const config = getConfig();

  return (
    <>
      <button
        onClick={() => {
          if (source === "mock") setShowModal(true);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border backdrop-blur-sm transition-all ${config.bg} ${config.text} ${source === "mock" ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
        {config.label}
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
