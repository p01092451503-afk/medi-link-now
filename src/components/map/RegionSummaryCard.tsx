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
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 border border-gray-100">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {/* Region & Hospital Count */}
        <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200">
          <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-foreground whitespace-nowrap">{summary.totalHospitals}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">병원</span>
          </div>
        </div>

        {/* Total Available Beds */}
        <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200">
          <Bed className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">{summary.totalBeds}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">가용</span>
          </div>
        </div>

        {/* Bed Type Breakdown */}
        <div className="flex items-center gap-2">
          {/* General */}
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-xs font-medium text-blue-700 whitespace-nowrap">성인 {summary.totalGeneral}</span>
          </div>
          
          {/* Pediatric */}
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-lg">
            <Baby className="w-3 h-3 text-purple-600 flex-shrink-0" />
            <span className="text-xs font-medium text-purple-700 whitespace-nowrap">{summary.totalPediatric}</span>
          </div>
          
          {/* Fever/Isolation */}
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg">
            <Thermometer className="w-3 h-3 text-orange-600 flex-shrink-0" />
            <span className="text-xs font-medium text-orange-700 whitespace-nowrap">{summary.totalFever}</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-xs text-muted-foreground">{summary.availableCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="text-xs text-muted-foreground">{summary.limitedCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-xs text-muted-foreground">{summary.fullCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionSummaryCard;
