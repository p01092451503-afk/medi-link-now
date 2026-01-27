import { useMemo } from "react";
import { Building2, Bed, Baby, Thermometer, TrendingUp } from "lucide-react";
import { Hospital, getHospitalStatus } from "@/data/hospitals";

interface RegionSummaryCardProps {
  hospitals: Hospital[];
  regionName: string;
}

const RegionSummaryCard = ({ hospitals, regionName }: RegionSummaryCardProps) => {
  const summary = useMemo(() => {
    const totalHospitals = hospitals.length;
    const totalGeneral = hospitals.reduce((sum, h) => sum + (h.beds?.general || 0), 0);
    const totalPediatric = hospitals.reduce((sum, h) => sum + (h.beds?.pediatric || 0), 0);
    const totalFever = hospitals.reduce((sum, h) => sum + (h.beds?.fever || 0), 0);
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
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md px-2 py-1.5 border border-gray-100">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Region & Hospital Count */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-bold text-foreground whitespace-nowrap">{summary.totalHospitals}</span>
          <span className="text-[10px] text-muted-foreground">병원</span>
        </div>

        {/* Total Available Beds */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <Bed className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">{summary.totalBeds}</span>
          <span className="text-[10px] text-muted-foreground">가용</span>
        </div>

        {/* Bed Type Breakdown - Compact */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span className="text-[10px] text-muted-foreground">성인</span>
            <span className="text-xs font-medium text-blue-700">{summary.totalGeneral}</span>
          </div>
          
          <div className="flex items-center gap-0.5">
            <Baby className="w-3 h-3 text-purple-600 flex-shrink-0" />
            <span className="text-xs font-medium text-purple-700">{summary.totalPediatric}</span>
          </div>
          
          <div className="flex items-center gap-0.5">
            <Thermometer className="w-3 h-3 text-orange-600 flex-shrink-0" />
            <span className="text-xs font-medium text-orange-700">{summary.totalFever}</span>
          </div>
        </div>

        {/* Status Indicator - Compact */}
        <div className="flex items-center gap-1 pl-1.5 border-l border-gray-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className="text-[10px] text-muted-foreground">{summary.availableCount}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
          <span className="text-[10px] text-muted-foreground">{summary.limitedCount}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          <span className="text-[10px] text-muted-foreground">{summary.fullCount}</span>
        </div>
      </div>
    </div>
  );
};

export default RegionSummaryCard;
