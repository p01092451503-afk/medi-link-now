import { Truck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface BedStatusCardProps {
  label: string;
  count: number;
  adjustedCount?: number;
  incomingCount?: number;
  icon: React.ElementType;
  type: "general" | "pediatric" | "fever";
  showTooltip?: boolean;
  tooltipText?: string;
  isHospitalFull?: boolean;
  rawCount?: number;
}

const BedStatusCard = ({
  label,
  count,
  adjustedCount,
  incomingCount,
  icon: Icon,
  type,
  showTooltip,
  tooltipText,
  isHospitalFull,
  rawCount,
}: BedStatusCardProps) => {
  const displayCount = adjustedCount !== undefined ? adjustedCount : Math.max(0, count);
  const hasIncoming = incomingCount !== undefined && incomingCount > 0;
  const isAvailable = displayCount > 0;
  const isOvercrowded = (rawCount !== undefined && rawCount < 0) || (count < 0 && adjustedCount === undefined);
  const overflowCount = isOvercrowded ? Math.abs(rawCount ?? count) : 0;

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl ${
      isOvercrowded ? "bg-destructive/10 ring-1 ring-destructive/20" : "bg-secondary"
    }`}>
      <Icon className={`w-5 h-5 mb-1.5 ${
        isOvercrowded ? "text-destructive" : isAvailable ? "text-foreground" : "text-muted-foreground/50"
      }`} />
      {isOvercrowded ? (
        <>
          <span className="text-2xl font-bold tracking-tight text-destructive">0</span>
          <div className="flex flex-col items-center gap-0.5 mt-1">
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className="text-[10px] font-bold text-destructive animate-pulse">
              초과 {overflowCount}명
            </span>
          </div>
        </>
      ) : (
        <>
          <span className={`text-2xl font-bold tracking-tight ${
            isAvailable ? "text-foreground" : isHospitalFull ? "text-destructive" : "text-muted-foreground/40"
          }`}>
            {displayCount}
          </span>
          <div className="flex flex-col items-center gap-0.5 mt-1">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">{label}</span>
              {showTooltip && tooltipText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-[200px]">{tooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {hasIncoming && (
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-0.5">
                <Truck className="w-3 h-3" />
                이송 중 {incomingCount}대
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BedStatusCard;
