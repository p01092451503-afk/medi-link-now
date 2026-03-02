import { useState } from "react";
import { Shield, Zap } from "lucide-react";
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

  const formatTime = (date: Date | null): string => {
    if (!date) return "";
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const getConfig = () => {
    if (source === "mock") {
      return {
        dot: "bg-destructive",
        label: "샘플 데이터",
        time: "",
        isMock: true,
      };
    }
    if (source === "cache" || (cacheMinutes !== null && cacheMinutes > 20)) {
      return {
        dot: "bg-warning",
        label: "캐시",
        time: formatTime(lastUpdated),
        isMock: false,
      };
    }
    return {
      dot: "bg-success animate-pulse",
      label: "NEDIS · 119",
      time: formatTime(lastApiRefresh),
      isMock: false,
    };
  };

  const config = getConfig();

  return (
    <>
      <button
        onClick={() => config.isMock && setShowModal(true)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/80 backdrop-blur-sm border border-border/50 shadow-sm text-muted-foreground ${config.isMock ? "cursor-pointer hover:bg-white" : "cursor-default"}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
        <Zap className="w-2.5 h-2.5 text-primary/70" />
        {config.label}
        {config.time && (
          <span className="text-muted-foreground/60 ml-0.5">{config.time}</span>
        )}

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
