import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, MapPin, Building2, BarChart3 } from "lucide-react";
import { Hospital, regionOptions } from "@/data/hospitals";
import RegionalHeatmapChart from "@/components/hospital/RegionalHeatmapChart";

interface RegionStats {
  id: string;
  label: string;
  labelKr: string;
  count: number;
}

interface RegionalStatsCardProps {
  hospitals: Hospital[];
  onRegionClick?: (regionId: string) => void;
}

const RegionalStatsCard = ({ hospitals, onRegionClick }: RegionalStatsCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate stats by major region
  const regionStats: RegionStats[] = regionOptions
    .filter((r) => !r.parent && r.id !== "all")
    .map((region) => {
      const count = hospitals.filter((h) => {
        // Match by region field or by address
        if (h.region === region.id) return true;
        // Fallback: match by Korean address prefix
        const addressMatch = h.address?.includes(region.labelKr.split(" ")[0]);
        return addressMatch;
      }).length;
      
      return {
        id: region.id,
        label: region.label,
        labelKr: region.labelKr,
        count,
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalHospitals = hospitals.length;
  const topRegions = isExpanded ? regionStats : regionStats.slice(0, 5);

  if (totalHospitals === 0) return null;

  return (
    <motion.div
      layout
      className="absolute bottom-44 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden"
      style={{ width: isExpanded ? 220 : 180 }}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <h4 className="text-xs font-semibold text-foreground">지역별 병원</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-600">{totalHospitals}개</span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="p-0.5">
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 max-h-[300px] overflow-y-auto scrollbar-hide">
        <div className="space-y-1">
          {topRegions.map((region, index) => {
            const percentage = Math.round((region.count / totalHospitals) * 100);
            return (
              <button
                key={region.id}
                onClick={() => onRegionClick?.(region.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-[10px] font-medium text-muted-foreground w-4">
                    {index + 1}.
                  </span>
                  <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">
                    {region.labelKr}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 min-w-[28px] text-right">
                    {region.count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Expand/Collapse hint */}
        {regionStats.length > 5 && (
          <div className="mt-2 pt-2 border-t border-gray-100 text-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 mx-auto"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  접기
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  {regionStats.length - 5}개 더보기
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RegionalStatsCard;
