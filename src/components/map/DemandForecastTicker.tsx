 import { useState, useEffect, useMemo } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { BarChart3, TrendingUp, AlertTriangle, Clock, X } from "lucide-react";
 import { getDemandForecast } from "@/data/fire119Stats";
 
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
 
   const getLevelBadgeColor = (level: string) => {
     switch (level) {
       case "critical": return "bg-red-500";
       case "high": return "bg-orange-500";
       case "moderate": return "bg-amber-500";
       default: return "bg-emerald-500";
     }
   };
   
   return (
     <div className={`absolute top-[72px] right-4 z-[1000] ${className}`}>
       {/* Collapsed Button */}
       <AnimatePresence mode="wait">
         {!isExpanded ? (
           <motion.button
             key="collapsed"
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.8 }}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setIsExpanded(true)}
             className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-lg border backdrop-blur-sm ${getLevelBg(forecast.demandLevel)}`}
           >
             <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getLevelColor(forecast.demandLevel)} flex items-center justify-center shadow-sm`}>
               <BarChart3 className="w-3.5 h-3.5 text-white" />
             </div>
             <span className="text-[10px] font-bold text-slate-700">119</span>
             {/* Level indicator dot */}
             <span className={`w-2 h-2 rounded-full ${getLevelBadgeColor(forecast.demandLevel)}`} />
           </motion.button>
         ) : (
           <motion.div
             key="expanded"
             initial={{ opacity: 0, scale: 0.9, y: -10 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.9, y: -10 }}
             className={`w-72 rounded-2xl border shadow-xl backdrop-blur-sm overflow-hidden ${getLevelBg(forecast.demandLevel)}`}
           >
             {/* Header */}
             <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200/50">
               <div className="flex items-center gap-2">
                 <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getLevelColor(forecast.demandLevel)} flex items-center justify-center shadow-sm`}>
                   <BarChart3 className="w-4 h-4 text-white" />
                 </div>
                 <div>
                   <div className="flex items-center gap-1.5">
                     <span className="text-xs font-bold text-slate-700">119 통계 인사이트</span>
                     <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded text-white ${getLevelBadgeColor(forecast.demandLevel)}`}>
                       {getLevelText(forecast.demandLevel)}
                     </span>
                   </div>
                 </div>
               </div>
               <button
                 onClick={() => setIsExpanded(false)}
                 className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors"
               >
                 <X className="w-4 h-4 text-slate-500" />
               </button>
             </div>
             
             {/* Content */}
             <div className="p-3">
               <p className="text-[11px] text-slate-600 mb-3">
                 {forecast.message}
               </p>
               
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
     </div>
   );
 };
 
 export default DemandForecastTicker;