 import { useState, useEffect, useMemo } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { BarChart3, TrendingUp, AlertTriangle, Clock, ChevronRight, X } from "lucide-react";
 import { getDemandForecast, RegionDemandForecast } from "@/data/fire119Stats";
 
 interface DemandForecastTickerProps {
   regionId?: string;
   className?: string;
 }
 
 const DemandForecastTicker = ({ regionId = "gangnam", className = "" }: DemandForecastTickerProps) => {
   const [isVisible, setIsVisible] = useState(true);
   const [isExpanded, setIsExpanded] = useState(false);
   const [currentRegion, setCurrentRegion] = useState(regionId);
   
   // Rotate through different regions periodically
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
   
   const forecast = useMemo(() => getDemandForecast(currentRegion), [currentRegion]);
   
   if (!isVisible || !forecast) return null;
   
   const getLevelColor = (level: string) => {
     switch (level) {
       case "critical": return "from-red-500 to-orange-500";
       case "high": return "from-orange-500 to-amber-500";
       case "moderate": return "from-amber-500 to-yellow-500";
       default: return "from-emerald-500 to-teal-500";
     }
   };
   
   const getLevelBg = (level: string) => {
     switch (level) {
       case "critical": return "bg-red-50 border-red-200";
       case "high": return "bg-orange-50 border-orange-200";
       case "moderate": return "bg-amber-50 border-amber-200";
       default: return "bg-emerald-50 border-emerald-200";
     }
   };
   
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
         return <AlertTriangle className="w-3.5 h-3.5" />;
       default:
         return <TrendingUp className="w-3.5 h-3.5" />;
     }
   };
   
   return (
     <AnimatePresence>
       <motion.div
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -20 }}
         className={`absolute top-3 left-3 right-16 z-[999] ${className}`}
       >
         <motion.div
           className={`rounded-2xl border shadow-lg backdrop-blur-sm overflow-hidden ${getLevelBg(forecast.demandLevel)}`}
           layout
         >
           {/* Main Ticker */}
           <button
             onClick={() => setIsExpanded(!isExpanded)}
             className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
           >
             {/* Indicator */}
             <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getLevelColor(forecast.demandLevel)} flex items-center justify-center shadow-sm`}>
               <BarChart3 className="w-4 h-4 text-white" />
             </div>
             
             {/* Content */}
             <div className="flex-1 min-w-0">
               <div className="flex items-center gap-1.5">
                 <span className="text-[11px] font-bold text-slate-700 truncate">
                   119 통계 인사이트
                 </span>
                 <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                   forecast.demandLevel === "critical" ? "bg-red-500 text-white" :
                   forecast.demandLevel === "high" ? "bg-orange-500 text-white" :
                   forecast.demandLevel === "moderate" ? "bg-amber-500 text-white" :
                   "bg-emerald-500 text-white"
                 }`}>
                   {getLevelText(forecast.demandLevel)}
                 </span>
               </div>
               <p className="text-[10px] text-slate-600 truncate mt-0.5">
                 {forecast.message}
               </p>
             </div>
             
             {/* Actions */}
             <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
             
             {/* Close button */}
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setIsVisible(false);
               }}
               className="p-1 hover:bg-slate-200/50 rounded-full transition-colors"
             >
               <X className="w-3.5 h-3.5 text-slate-400" />
             </button>
           </button>
           
           {/* Expanded Details */}
           <AnimatePresence>
             {isExpanded && (
               <motion.div
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: "auto", opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 transition={{ duration: 0.2 }}
                 className="overflow-hidden"
               >
                 <div className="px-3 pb-3 pt-1 border-t border-slate-200/50">
                   <div className="grid grid-cols-2 gap-2">
                     {/* Current Time Stats */}
                     <div className="p-2 bg-white/60 rounded-lg">
                       <div className="flex items-center gap-1.5 mb-1">
                         <Clock className="w-3 h-3 text-slate-500" />
                         <span className="text-[9px] font-medium text-slate-500">현재 시간대</span>
                       </div>
                       <p className="text-sm font-bold text-slate-800">
                         {forecast.hour}시 ~ {(forecast.hour + 1) % 24}시
                       </p>
                     </div>
                     
                     {/* Avg Incidents */}
                     <div className="p-2 bg-white/60 rounded-lg">
                       <div className="flex items-center gap-1.5 mb-1">
                         {getLevelIcon(forecast.demandLevel)}
                         <span className="text-[9px] font-medium text-slate-500">평균 출동</span>
                       </div>
                       <p className="text-sm font-bold text-slate-800">
                         {forecast.avgIncidents}건<span className="text-[10px] font-normal text-slate-500">/시간</span>
                       </p>
                     </div>
                   </div>
                   
                   {/* Disclaimer */}
                   <p className="text-[8px] text-slate-400 text-center mt-2">
                     ※ 과거 3년 119 출동 통계 기반 예측 · 실제와 다를 수 있음
                   </p>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
         </motion.div>
       </motion.div>
     </AnimatePresence>
   );
 };
 
 export default DemandForecastTicker;