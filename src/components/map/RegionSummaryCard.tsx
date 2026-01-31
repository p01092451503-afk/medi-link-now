import { useMemo, useRef, useState, useEffect } from "react";
import { Building2, Bed } from "lucide-react";
import { Hospital, getHospitalStatus } from "@/data/hospitals";

interface RegionSummaryCardProps {
  hospitals: Hospital[];
  regionName: string;
}

const RegionSummaryCard = ({ hospitals, regionName }: RegionSummaryCardProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

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

  // Check scroll position to show/hide fade indicators
  const checkScrollPosition = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftFade(scrollLeft > 4);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkScrollPosition();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener("scroll", checkScrollPosition);
      // Check on resize too
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        scrollEl.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [hospitals]);

  if (hospitals.length === 0) return null;

  return (
    <section 
      aria-label={`${regionName} 지역 응급실 현황 요약`}
      className="relative bg-white/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 max-w-[calc(100vw-2rem)] overflow-hidden"
    >
      {/* Left fade indicator */}
      {showLeftFade && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white/50 to-transparent z-10 pointer-events-none rounded-l-xl"
          aria-hidden="true"
        />
      )}
      
      {/* Right fade indicator */}
      {showRightFade && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white/50 to-transparent z-10 pointer-events-none rounded-r-xl"
          aria-hidden="true"
        />
      )}

      <div 
        ref={scrollRef}
        className="flex items-center gap-2 sm:gap-3 md:gap-4 px-2 sm:px-3 md:px-4 py-2 md:py-3 overflow-x-auto scrollbar-hide touch-pan-x"
        role="list"
        aria-label="응급실 통계"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {/* Region & Hospital Count */}
        <div 
          className="flex items-center gap-1 sm:gap-1.5 md:gap-2 pr-2 sm:pr-3 md:pr-4 border-r border-gray-300 flex-shrink-0"
          role="listitem"
          aria-label={`총 ${summary.totalHospitals}개 병원`}
        >
          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary flex-shrink-0" aria-hidden="true" />
          <span className="text-sm sm:text-base md:text-lg font-bold text-foreground whitespace-nowrap" aria-hidden="true">
            {summary.totalHospitals}
          </span>
          <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground" aria-hidden="true">병원</span>
          <span className="sr-only">{summary.totalHospitals}개 병원</span>
        </div>

        {/* Total Available Beds */}
        <div 
          className="flex items-center gap-1 sm:gap-1.5 md:gap-2 pr-2 sm:pr-3 md:pr-4 border-r border-gray-300 flex-shrink-0"
          role="listitem"
          aria-label={`총 ${summary.totalBeds}개 가용 병상`}
        >
          <Bed className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm sm:text-base md:text-lg font-bold text-emerald-600 whitespace-nowrap" aria-hidden="true">
            {summary.totalBeds}
          </span>
          <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground" aria-hidden="true">가용</span>
          <span className="sr-only">{summary.totalBeds}개 가용 병상</span>
        </div>

        {/* Bed Type Breakdown */}
        <fieldset 
          className="flex items-center gap-1.5 sm:gap-2 md:gap-3 pr-2 sm:pr-3 md:pr-4 border-r border-gray-300 flex-shrink-0 border-0 p-0 m-0"
          role="group"
          aria-label="병상 유형별 현황"
        >
          <legend className="sr-only">병상 유형별 가용 현황</legend>
          
          <div 
            className="flex items-center gap-0.5"
            role="listitem"
            aria-label={`성인 응급 병상 ${summary.totalGeneral}개`}
          >
            <span 
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-500 flex-shrink-0" 
              aria-hidden="true"
            />
            <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground" aria-hidden="true">성인</span>
            <span className="text-xs sm:text-sm md:text-base font-semibold text-blue-700" aria-hidden="true">
              {summary.totalGeneral}
            </span>
            <span className="sr-only">성인 응급 병상 {summary.totalGeneral}개</span>
          </div>
          
          <div 
            className="flex items-center gap-0.5"
            role="listitem"
            aria-label={`소아 응급 병상 ${summary.totalPediatric}개`}
          >
            <span 
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-purple-500 flex-shrink-0" 
              aria-hidden="true"
            />
            <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground" aria-hidden="true">소아</span>
            <span className="text-xs sm:text-sm md:text-base font-semibold text-purple-700" aria-hidden="true">
              {summary.totalPediatric}
            </span>
            <span className="sr-only">소아 응급 병상 {summary.totalPediatric}개</span>
          </div>
          
          <div 
            className="flex items-center gap-0.5"
            role="listitem"
            aria-label={`열감염 병상 ${summary.totalFever}개`}
          >
            <span 
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-orange-500 flex-shrink-0" 
              aria-hidden="true"
            />
            <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap" aria-hidden="true">열감염</span>
            <span className="text-xs sm:text-sm md:text-base font-semibold text-orange-700" aria-hidden="true">
              {summary.totalFever}
            </span>
            <span className="sr-only">열감염 병상 {summary.totalFever}개</span>
          </div>
        </fieldset>

        {/* Status Indicator - Always visible */}
        <fieldset 
          className="flex items-center gap-1 sm:gap-1.5 md:gap-3 flex-shrink-0 border-0 p-0 m-0 pr-1"
          role="group"
          aria-label="병원 혼잡도 현황"
        >
          <legend className="sr-only">병원 혼잡도 현황</legend>
          
          <div 
            className="flex items-center gap-0.5"
            role="listitem"
            aria-label={`여유 있는 병원 ${summary.availableCount}개`}
          >
            <span 
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 flex-shrink-0" 
              aria-hidden="true"
            />
            <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground" aria-hidden="true">여유</span>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-foreground" aria-hidden="true">
              {summary.availableCount}
            </span>
            <span className="sr-only">여유 있는 병원 {summary.availableCount}개</span>
          </div>
          
          <div 
            className="flex items-center gap-0.5"
            role="listitem"
            aria-label={`보통 혼잡도 병원 ${summary.limitedCount}개`}
          >
            <span 
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-yellow-500 flex-shrink-0" 
              aria-hidden="true"
            />
            <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground" aria-hidden="true">보통</span>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-foreground" aria-hidden="true">
              {summary.limitedCount}
            </span>
            <span className="sr-only">보통 혼잡도 병원 {summary.limitedCount}개</span>
          </div>
          
          <div 
            className="flex items-center gap-0.5"
            role="listitem"
            aria-label={`혼잡한 병원 ${summary.fullCount}개`}
          >
            <span 
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500 flex-shrink-0" 
              aria-hidden="true"
            />
            <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground" aria-hidden="true">혼잡</span>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-foreground" aria-hidden="true">
              {summary.fullCount}
            </span>
            <span className="sr-only">혼잡한 병원 {summary.fullCount}개</span>
          </div>
        </fieldset>
      </div>
    </section>
  );
};

export default RegionSummaryCard;
