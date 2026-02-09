 import { useState, useEffect, useMemo } from "react";
 import { BarChart3, TrendingUp, AlertTriangle, Clock } from "lucide-react";
 import { getDemandForecast } from "@/data/fire119Stats";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 
interface DemandForecastTickerProps {
  regionId?: string;
  userDistrictName?: string;
  className?: string;
}

const DemandForecastTicker = ({ regionId = "gangnam", userDistrictName, className = "" }: DemandForecastTickerProps) => {
  const [currentRegion, setCurrentRegion] = useState(regionId);
  
  const regions = ["gangnam", "mapo", "songpa", "yeongdeungpo", "suwon", "seongnam"];
  
  useEffect(() => {
    if (regionId) {
      setCurrentRegion(regionId);
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentRegion(prev => {
        const currentIndex = regions.indexOf(prev);
        return regions[(currentIndex + 1) % regions.length];
      });
    }, 8000);
    
    return () => clearInterval(interval);
  }, [regionId]);
  
  const forecast = useMemo(() => getDemandForecast(currentRegion, userDistrictName), [currentRegion, userDistrictName]);
  
  if (!forecast) return null;
   
   const getLevelText = (level: string) => {
     switch (level) {
       case "critical": return "매우 높음";
       case "high": return "높음";
       case "moderate": return "보통";
       default: return "낮음";
     }
   };
   
   const getLevelIcon = (level: string) => {
     switch (level) {
       case "critical":
       case "high":
         return <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />;
       default:
         return <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />;
     }
   };

   const getLevelBadgeStyle = (level: string) => {
     switch (level) {
       case "critical": 
       case "high":
         return "bg-foreground text-background";
       default: 
         return "bg-secondary text-foreground";
     }
   };
   
   return (
     <Popover>
       <PopoverTrigger asChild>
          <button
            className={`flex items-center gap-1.5 h-8 px-3 bg-card rounded-full shadow-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors whitespace-nowrap flex-shrink-0 ${className}`}
          >
            <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>119 통계</span>
            <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
          </button>
       </PopoverTrigger>
       <PopoverContent 
         className="w-72 p-0 rounded-2xl border border-border shadow-xl overflow-hidden z-[2000] bg-background"
         side="bottom"
         align="end"
       >
         {/* Header */}
         <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
           <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
             <BarChart3 className="w-4 h-4 text-foreground" />
           </div>
           <div className="flex items-center gap-2">
             <span className="text-sm font-bold text-foreground">119 통계 인사이트</span>
             <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${getLevelBadgeStyle(forecast.demandLevel)}`}>
               {getLevelText(forecast.demandLevel)}
             </span>
           </div>
         </div>
         
         {/* Content */}
         <div className="p-4">
           <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
             {forecast.message}
           </p>
           
           <div className="grid grid-cols-2 gap-3">
             {/* Current Time Stats */}
             <div className="p-3 bg-secondary rounded-xl">
               <div className="flex items-center gap-1.5 mb-1.5">
                 <Clock className="w-3 h-3 text-muted-foreground" />
                 <span className="text-[10px] font-medium text-muted-foreground">현재 시간대</span>
               </div>
               <p className="text-base font-bold text-foreground">
                 {forecast.hour}시 ~ {(forecast.hour + 1) % 24}시
               </p>
             </div>
             
             {/* Avg Incidents */}
             <div className="p-3 bg-secondary rounded-xl">
               <div className="flex items-center gap-1.5 mb-1.5">
                 {getLevelIcon(forecast.demandLevel)}
                 <span className="text-[10px] font-medium text-muted-foreground">평균 출동</span>
               </div>
               <p className="text-base font-bold text-foreground">
                 {forecast.avgIncidents}건<span className="text-xs font-normal text-muted-foreground">/시간</span>
               </p>
             </div>
           </div>
           
           {/* Disclaimer */}
           <p className="text-[9px] text-muted-foreground/60 text-center mt-3">
             ※ 과거 3년 119 출동 통계 기반 예측 · 실제와 다를 수 있음
           </p>
         </div>
       </PopoverContent>
     </Popover>
   );
 };
 
 export default DemandForecastTicker;