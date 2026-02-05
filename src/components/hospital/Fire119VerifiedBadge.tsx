 import { useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Ambulance, TrendingUp, ChevronDown, ChevronUp, Award, BarChart3 } from "lucide-react";
 import { isHospital119Verified, getSpecialtyBadgeText, getHospitalBusyHours, HourlyBusyData } from "@/data/fire119Stats";
 import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from "@/components/ui/tooltip";
 
 interface Fire119VerifiedBadgeProps {
   hospitalName: string;
   hospitalId?: number;
   showChart?: boolean;
 }
 
 const BusyHoursChart = ({ data }: { data: HourlyBusyData[] }) => {
   const maxIncidents = Math.max(...data.map(d => d.incidents));
   const currentHour = new Date().getHours();
   
   return (
     <div className="mt-3 p-3 bg-white/80 rounded-xl border border-slate-200/50">
       <div className="flex items-center gap-2 mb-3">
         <BarChart3 className="w-4 h-4 text-slate-600" />
         <span className="text-xs font-semibold text-slate-700">시간대별 119 도착 통계</span>
         <span className="text-[9px] text-slate-400 ml-auto">3년 평균</span>
       </div>
       
       {/* Mini bar chart */}
       <div className="flex items-end gap-0.5 h-16">
         {data.map((item, idx) => {
           const height = (item.incidents / maxIncidents) * 100;
           const isCurrentHour = item.hour === currentHour;
           
           let barColor = "bg-slate-200";
           if (item.level === "high") barColor = "bg-red-400";
           else if (item.level === "moderate") barColor = "bg-amber-400";
           else barColor = "bg-emerald-400";
           
           return (
             <TooltipProvider key={idx}>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <div
                     className={`flex-1 rounded-t transition-all cursor-pointer hover:opacity-80 ${barColor} ${
                       isCurrentHour ? "ring-2 ring-primary ring-offset-1" : ""
                     }`}
                     style={{ height: `${Math.max(height, 8)}%` }}
                   />
                 </TooltipTrigger>
                 <TooltipContent side="top" className="text-xs">
                   <p className="font-medium">{item.hour}시</p>
                   <p className="text-muted-foreground">평균 {item.incidents}건/시간</p>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
           );
         })}
       </div>
       
       {/* Time labels */}
       <div className="flex justify-between mt-1.5 text-[9px] text-slate-400">
         <span>0시</span>
         <span>6시</span>
         <span>12시</span>
         <span>18시</span>
         <span>24시</span>
       </div>
       
       {/* Legend */}
       <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-slate-100">
         <div className="flex items-center gap-1">
           <div className="w-2 h-2 rounded-sm bg-emerald-400" />
           <span className="text-[9px] text-slate-500">한산</span>
         </div>
         <div className="flex items-center gap-1">
           <div className="w-2 h-2 rounded-sm bg-amber-400" />
           <span className="text-[9px] text-slate-500">보통</span>
         </div>
         <div className="flex items-center gap-1">
           <div className="w-2 h-2 rounded-sm bg-red-400" />
           <span className="text-[9px] text-slate-500">혼잡</span>
         </div>
       </div>
     </div>
   );
 };
 
 const Fire119VerifiedBadge = ({ hospitalName, hospitalId, showChart = true }: Fire119VerifiedBadgeProps) => {
   const [isExpanded, setIsExpanded] = useState(false);
   const verificationResult = isHospital119Verified(hospitalName);
   
   if (!verificationResult.verified) {
     return null;
   }
   
   const specialtyText = verificationResult.specialty 
     ? getSpecialtyBadgeText(verificationResult.specialty)
     : "응급";
   
   const busyHoursData = hospitalId ? getHospitalBusyHours(hospitalId) : null;
   
   return (
     <div className="mb-4">
       {/* Main Badge */}
       <motion.button
         onClick={() => showChart && setIsExpanded(!isExpanded)}
         className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border border-red-200/60 hover:border-red-300/80 transition-all group"
         whileTap={showChart ? { scale: 0.98 } : undefined}
       >
         {/* Icon */}
         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-sm shadow-red-500/20">
           <Ambulance className="w-5 h-5 text-white" />
         </div>
         
         {/* Content */}
         <div className="flex-1 text-left">
           <div className="flex items-center gap-1.5">
             <span className="text-sm font-bold text-slate-800">119 최다 이송 병원</span>
             <span className="px-1.5 py-0.5 text-[9px] font-bold text-red-600 bg-red-100 rounded">
               TOP {verificationResult.ranking}
             </span>
           </div>
           <p className="text-[11px] text-slate-500 mt-0.5">
             소방청 통계 기준 · {specialtyText} 분야 상위 이송
           </p>
         </div>
         
         {/* Expand indicator */}
         {showChart && busyHoursData && (
           <div className="flex items-center gap-1 text-slate-400">
             <BarChart3 className="w-4 h-4" />
             {isExpanded ? (
               <ChevronUp className="w-4 h-4" />
             ) : (
               <ChevronDown className="w-4 h-4" />
             )}
           </div>
         )}
       </motion.button>
       
       {/* Expandable Chart Section */}
       <AnimatePresence>
         {isExpanded && showChart && busyHoursData && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: "auto", opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.3, ease: "easeInOut" }}
             className="overflow-hidden"
           >
             <BusyHoursChart data={busyHoursData} />
             
             {/* Disclaimer */}
             <p className="text-[9px] text-center text-slate-400 mt-2 px-2">
               ※ 본 통계는 과거 119 이송 데이터 분석에 기반한 참고 정보입니다
             </p>
           </motion.div>
         )}
       </AnimatePresence>
     </div>
   );
 };
 
 export default Fire119VerifiedBadge;