import { useMemo } from "react";
import { Building2, Bed } from "lucide-react";
import { Hospital, getHospitalStatus } from "@/data/hospitals";

interface RegionSummaryCardProps {
  hospitals: Hospital[];
  regionName: string;
}

const RegionSummaryCard = ({ hospitals, regionName }: RegionSummaryCardProps) => {
  const summary = useMemo(() => {
    const totalHospitals = hospitals.length;
    // Normalize negative values to 0
    const totalGeneral = hospitals.reduce((sum, h) => sum + Math.max(0, h.beds?.general || 0), 0);
    const totalPediatric = hospitals.reduce((sum, h) => sum + Math.max(0, h.beds?.pediatric || 0), 0);
    const totalFever = hospitals.reduce((sum, h) => sum + Math.max(0, h.beds?.fever || 0), 0);
    const totalBeds = totalGeneral + totalPediatric + totalFever;
    
    // Count hospitals by status
    const availableCount = hospitals.filter((h) => getHospitalStatus(h) === "available").length;
    const limitedCount = hospitals.filter((h) => getHospitalStatus(h) === "limited").length;
    const fullCount = hospitals.filter((h) => getHospitalStatus(h) === "unavailable").length;

    return {
      totalHospitals,
      totalBeds,
      totalGeneral,
      totalPediatric,
      totalFever,
      availableCount,
      limitedCount,
      fullCount,
    };
  }, [hospitals]);

  if (hospitals.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 w-fit max-w-[calc(100vw-2rem)]">
      <div className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 md:py-3 overflow-x-auto scrollbar-hide w-fit">
        {/* Region & Hospital Count */}
        <div className="flex items-center gap-1.5 md:gap-2 pr-3 md:pr-4 border-r border-gray-300 flex-shrink-0">
          <Building2 className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
          <span className="text-base md:text-lg font-bold text-foreground whitespace-nowrap">{summary.totalHospitals}</span>
          <span className="text-xs md:text-sm text-muted-foreground">병원</span>
        </div>

        {/* Total Available Beds */}
        <div className="flex items-center gap-1.5 md:gap-2 pr-3 md:pr-4 border-r border-gray-300 flex-shrink-0">
          <Bed className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-base md:text-lg font-bold text-emerald-600 whitespace-nowrap">{summary.totalBeds}</span>
          <span className="text-xs md:text-sm text-muted-foreground">가용</span>
        </div>

        {/* Bed Type Breakdown */}
        <div className="flex items-center gap-2 md:gap-3 pr-3 md:pr-4 border-r border-gray-300 flex-shrink-0">
          <div className="flex items-center gap-0.5 md:gap-1">
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-500 flex-shrink-0"></span>
            <span className="text-xs md:text-sm text-muted-foreground">성인</span>
            <span className="text-sm md:text-base font-semibold text-blue-700">{summary.totalGeneral}</span>
          </div>
          
          <div className="flex items-center gap-0.5 md:gap-1">
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-purple-500 flex-shrink-0"></span>
            <span className="text-xs md:text-sm text-muted-foreground">소아</span>
            <span className="text-sm md:text-base font-semibold text-purple-700">{summary.totalPediatric}</span>
          </div>
          
          <div className="flex items-center gap-0.5 md:gap-1">
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-orange-500 flex-shrink-0"></span>
            <span className="text-xs md:text-sm text-muted-foreground">열감염</span>
            <span className="text-sm md:text-base font-semibold text-orange-700">{summary.totalFever}</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <div className="flex items-center gap-0.5 md:gap-1">
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
            <span className="text-xs md:text-sm text-muted-foreground">여유</span>
            <span className="text-xs md:text-sm font-medium text-foreground">{summary.availableCount}</span>
          </div>
          <div className="flex items-center gap-0.5 md:gap-1">
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-yellow-500 flex-shrink-0"></span>
            <span className="text-xs md:text-sm text-muted-foreground">보통</span>
            <span className="text-xs md:text-sm font-medium text-foreground">{summary.limitedCount}</span>
          </div>
          <div className="flex items-center gap-0.5 md:gap-1">
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500 flex-shrink-0"></span>
            <span className="text-xs md:text-sm text-muted-foreground">혼잡</span>
            <span className="text-xs md:text-sm font-medium text-foreground">{summary.fullCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionSummaryCard;
