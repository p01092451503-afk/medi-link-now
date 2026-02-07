import { Moon } from "lucide-react";

interface MoonlightBadgeProps {
  isMoonlight: boolean;
}

/**
 * Identifies officially designated 달빛어린이병원 (Moonlight Children's Hospitals)
 * designated by the Ministry of Health and Welfare.
 * Only displays for hospitals verified via the 공공데이터 API.
 */
const MoonlightBadge = ({ isMoonlight }: MoonlightBadgeProps) => {
  if (!isMoonlight) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400">
      <Moon className="w-3 h-3" />
      달빛어린이병원
    </span>
  );
};

export default MoonlightBadge;
