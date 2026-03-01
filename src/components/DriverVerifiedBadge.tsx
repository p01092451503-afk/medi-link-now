import { ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDriverVerifiedStatus } from "@/hooks/useDriverVerification";

interface DriverVerifiedBadgeProps {
  driverId: string;
  size?: "sm" | "md";
}

const DriverVerifiedBadge = ({ driverId, size = "sm" }: DriverVerifiedBadgeProps) => {
  const { isVerified, verificationInfo } = useDriverVerifiedStatus(driverId);

  if (!isVerified) return null;

  const licenseLabel = verificationInfo?.license_type === "emt" ? "응급구조사 자격 보유" : "운전면허 인증";
  const expLabel = verificationInfo?.experience_years
    ? `${verificationInfo.experience_years}년 이상 경력`
    : null;

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5";
  const containerSize = size === "sm" ? "w-5 h-5" : "w-6 h-6";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`${containerSize} rounded-full bg-primary/10 flex items-center justify-center cursor-help`}>
          <ShieldCheck className={`${iconSize} text-primary`} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px] text-xs p-2">
        <p className="font-semibold mb-0.5">✅ 인증된 기사</p>
        <p className="text-muted-foreground">{licenseLabel}</p>
        {expLabel && <p className="text-muted-foreground">{expLabel}</p>}
      </TooltipContent>
    </Tooltip>
  );
};

export default DriverVerifiedBadge;
