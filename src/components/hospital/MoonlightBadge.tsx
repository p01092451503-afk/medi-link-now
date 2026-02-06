import { Moon } from "lucide-react";

interface MoonlightBadgeProps {
  hasPediatric: boolean;
}

/**
 * Identifies hospitals operating late at night with pediatric capabilities
 * (달빛어린이병원 - Moonlight Children's Hospitals)
 */
const MoonlightBadge = ({ hasPediatric }: MoonlightBadgeProps) => {
  if (!hasPediatric) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
      <Moon className="w-3 h-3" />
      🌙 달빛어린이병원
    </span>
  );
};

export default MoonlightBadge;
