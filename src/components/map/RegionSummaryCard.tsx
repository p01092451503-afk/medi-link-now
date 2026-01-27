import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { Hospital } from "@/data/hospitals";

interface RegionSummaryCardProps {
  hospitals: Hospital[];
  regionName: string;
}

const RegionSummaryCard = ({ hospitals, regionName }: RegionSummaryCardProps) => {
  const summary = useMemo(() => {
    // Normalize negative values to 0
    const totalGeneral = hospitals.reduce((sum, h) => sum + Math.max(0, h.beds?.general || 0), 0);
    const totalPediatric = hospitals.reduce((sum, h) => sum + Math.max(0, h.beds?.pediatric || 0), 0);
    const totalFever = hospitals.reduce((sum, h) => sum + Math.max(0, h.beds?.fever || 0), 0);

    return {
      totalGeneral,
      totalPediatric,
      totalFever,
    };
  }, [hospitals]);

  if (hospitals.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 w-fit">
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Selected Region */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 flex-shrink-0">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-bold text-foreground whitespace-nowrap">{regionName || "전체"}</span>
        </div>

        {/* Bed Type Breakdown */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
            <span className="text-xs text-muted-foreground">성인</span>
            <span className="text-sm font-semibold text-blue-700">{summary.totalGeneral}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></span>
            <span className="text-xs text-muted-foreground">소아</span>
            <span className="text-sm font-semibold text-purple-700">{summary.totalPediatric}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></span>
            <span className="text-xs text-muted-foreground">열감염</span>
            <span className="text-sm font-semibold text-orange-700">{summary.totalFever}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionSummaryCard;
