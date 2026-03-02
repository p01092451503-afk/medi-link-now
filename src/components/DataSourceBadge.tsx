import { Zap } from "lucide-react";
import { toast } from "sonner";

interface DataSourceBadgeProps {
  isRealtime: boolean;
  source: "api" | "db" | "cache" | "mock";
  lastUpdated: Date | null;
}

const DataSourceBadge = ({ isRealtime, source, lastUpdated }: DataSourceBadgeProps) => {
  const getMinutesAgo = (date: Date | null): number | null => {
    if (!date) return null;
    return Math.floor((Date.now() - date.getTime()) / 60000);
  };

  const minutesAgo = getMinutesAgo(lastUpdated);

  const handleClick = () => {
    if (source === "mock") {
      toast.warning(
        "현재 공공 API 연결이 원활하지 않아 사전 등록된 샘플 데이터를 표시합니다. 실제 병상 현황은 각 병원에 직접 확인하세요.",
        { duration: 5000 }
      );
    }
  };

  const getConfig = () => {
    if (source === "mock") {
      return {
        dot: "bg-destructive",
        label: "샘플 데이터 표시 중",
        clickable: true,
      };
    }

    if (isRealtime && source === "api") {
      return {
        dot: "bg-success animate-pulse",
        label: `NEDIS 실시간${minutesAgo !== null ? ` · ${minutesAgo}분 전 갱신` : ""}`,
        clickable: false,
      };
    }

    // cache or db within 20 min
    if (minutesAgo !== null && minutesAgo <= 20) {
      return {
        dot: "bg-warning",
        label: `캐시 데이터 · ${minutesAgo}분 전`,
        clickable: false,
      };
    }

    // stale cache
    return {
      dot: "bg-warning",
      label: `캐시 데이터${minutesAgo !== null ? ` · ${minutesAgo}분 전` : ""}`,
      clickable: false,
    };
  };

  const config = getConfig();

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] leading-[24px] font-medium bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm text-muted-foreground ${config.clickable ? "cursor-pointer hover:bg-background" : "cursor-default"}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <Zap className="w-2.5 h-2.5 text-primary/70" />
      {config.label}
    </button>
  );
};

export default DataSourceBadge;
