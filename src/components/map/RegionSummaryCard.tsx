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
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 border border-gray-200 w-fit">
      <div className="flex items-center gap-4">
        {/* Region & Hospital Count */}
        <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
          <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-lg font-bold text-foreground whitespace-nowrap">{summary.totalHospitals}</span>
          <span className="text-sm text-muted-foreground">병원</span>
        </div>

        {/* Total Available Beds */}
        <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
          <Bed className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-lg font-bold text-emerald-600 whitespace-nowrap">{summary.totalBeds}</span>
          <span className="text-sm text-muted-foreground">가용</span>
        </div>

        {/* Bed Type Breakdown */}
        <div className="flex items-center gap-3 pr-4 border-r border-gray-300">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-sm text-muted-foreground">성인</span>
            <span className="text-base font-semibold text-blue-700">{summary.totalGeneral}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span className="text-sm text-muted-foreground">소아</span>
            <span className="text-base font-semibold text-purple-700">{summary.totalPediatric}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-sm text-muted-foreground">열감염</span>
            <span className="text-base font-semibold text-orange-700">{summary.totalFever}</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span className="text-sm text-muted-foreground">여유</span>
            <span className="text-sm font-medium text-foreground">{summary.availableCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span className="text-sm text-muted-foreground">보통</span>
            <span className="text-sm font-medium text-foreground">{summary.limitedCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-sm text-muted-foreground">혼잡</span>
            <span className="text-sm font-medium text-foreground">{summary.fullCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionSummaryCard;
