import { Zap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataSourceBadgeProps {
  isRealtime: boolean;
  source: "api" | "db" | "cache" | "mock" | "offline";
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
        dot: "bg-destructive animate-pulse",
        bg: "bg-destructive/15 border-destructive/40",
        textColor: "text-destructive",
        label: "⚠️ 샘플 데이터",
        tooltip: "실제 데이터가 아닙니다. 응급 상황 시 119에 직접 문의하세요.",
        clickable: true,
        icon: <AlertTriangle className="w-2.5 h-2.5 text-destructive" />,
      };
    }

    if (isRealtime && source === "api") {
      return {
        dot: "bg-success animate-pulse",
        bg: "bg-success/10 border-success/40",
        textColor: "text-success",
        label: `🟢 실시간${minutesAgo !== null && minutesAgo > 0 ? ` · ${minutesAgo}분 전` : ""}`,
        tooltip: "NEDIS · 119 공공데이터 실시간 연동 중",
        clickable: false,
        icon: <Zap className="w-2.5 h-2.5 text-success" />,
      };
    }

    if (minutesAgo !== null && minutesAgo <= 20) {
      return {
        dot: "bg-warning",
        bg: "bg-warning/10 border-warning/40",
        textColor: "text-warning",
        label: `🟡 캐시 · ${minutesAgo}분 전`,
        tooltip: "캐시된 데이터입니다. 곧 갱신됩니다.",
        clickable: false,
        icon: <Zap className="w-2.5 h-2.5 text-warning" />,
      };
    }

    return {
      dot: "bg-warning",
      bg: "bg-warning/10 border-warning/40",
      textColor: "text-warning",
      label: `🟡 캐시${minutesAgo !== null ? ` · ${minutesAgo}분 전` : ""}`,
      tooltip: "캐시된 데이터입니다.",
      clickable: false,
      icon: <Zap className="w-2.5 h-2.5 text-warning" />,
    };
  };

  const config = getConfig();

  const badge = (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] leading-[24px] font-medium backdrop-blur-sm border shadow-sm ${config.bg} ${config.textColor} ${config.clickable ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {config.icon}
      {config.label}
      {lastUpdated && source !== "mock" && (
        <span className="ml-0.5 opacity-70">
          {lastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        {config.tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

export default DataSourceBadge;
