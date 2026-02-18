import { Radio } from "lucide-react";
import { LiveStatusLevel } from "@/hooks/useLiveHospitalStatus";

interface LiveStatusBadgeProps {
  status: LiveStatusLevel;
  minutesAgo: number;
  comment?: string | null;
}

const statusConfig: Record<LiveStatusLevel, { label: string; dotClass: string }> = {
  available: { label: "여유", dotClass: "bg-foreground" },
  busy: { label: "혼잡", dotClass: "bg-foreground/50" },
  full: { label: "만실", dotClass: "bg-destructive animate-pulse" },
};

const LiveStatusBadge = ({ status, minutesAgo, comment }: LiveStatusBadgeProps) => {
  const config = statusConfig[status];
  const timeLabel = minutesAgo < 1 ? "방금" : `${minutesAgo}분 전`;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border">
      <Radio className="w-4 h-4 text-foreground/70" />
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dotClass}`} />
          <span className="text-xs font-bold text-foreground">현장 제보: {config.label}</span>
          <span className="text-[10px] text-muted-foreground">({timeLabel})</span>
        </div>
        {comment && (
          <p className="text-[11px] text-muted-foreground truncate pl-3.5">"{comment}"</p>
        )}
      </div>
    </div>
  );
};

export default LiveStatusBadge;
