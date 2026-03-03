import { useState } from "react";
import { AlertTriangle, Users, CheckCircle2, ArrowRight, ChevronDown } from "lucide-react";
import AmbulanceLoader from "@/components/AmbulanceLoader";
import { useHospitalEnRouteCount } from "@/hooks/useAmbulanceTrips";
import { motion, AnimatePresence } from "framer-motion";

interface ShadowDemandCardProps {
  hospitalId: string;
  officialBeds: number;
}

const ShadowDemandCard = ({ hospitalId, officialBeds }: ShadowDemandCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { count: ambulancesEnRoute, isLoading } = useHospitalEnRouteCount(hospitalId);
  const estimatedBeds = Math.max(0, officialBeds - ambulancesEnRoute);
  const hasConflict = ambulancesEnRoute > 0 && estimatedBeds < officialBeds;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 shadow-lg">
      {/* Decorative background */}
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl" />
      
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">실시간 이동 현황</h4>
            <p className="text-[10px] text-muted-foreground">Shadow Demand Tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOpen && (
            <span className={`text-sm font-bold ${ambulancesEnRoute > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
              {isLoading ? "..." : `${ambulancesEnRoute}대 이동 중`}
            </span>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="relative px-4 pb-4">
              {/* Flow Visualization */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <motion.div 
                  className="flex-1 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 rounded-xl p-3 border border-orange-200/50 dark:border-orange-800/50 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  {isLoading ? (
                    <AmbulanceLoader variant="inline" />
                  ) : (
                    <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{ambulancesEnRoute}</p>
                  )}
                  <p className="text-[10px] font-medium text-orange-700/80 dark:text-orange-400/80">이동 중</p>
                </motion.div>

                <ArrowRight className="w-5 h-5 text-muted-foreground/50" />

                <motion.div 
                  className="flex-1 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl p-3 border border-slate-200/50 dark:border-slate-600/50 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">공식 데이터</p>
                  <p className="text-2xl font-black text-slate-600 dark:text-slate-300">{officialBeds}</p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">병상</p>
                </motion.div>

                <span className="text-muted-foreground/50">=</span>

                <motion.div 
                  className={`flex-1 rounded-xl p-3 text-center ring-2 ${
                    estimatedBeds > 5 
                      ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 ring-emerald-400/50 border border-emerald-200/50 dark:border-emerald-800/50" 
                      : estimatedBeds > 0 
                      ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 ring-amber-400/50 border border-amber-200/50 dark:border-amber-800/50" 
                      : "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 ring-red-400/50 border border-red-200/50 dark:border-red-800/50"
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">예상 가용</p>
                  <p className={`text-2xl font-black ${
                    estimatedBeds > 5 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : estimatedBeds > 0 
                      ? "text-amber-600 dark:text-amber-400" 
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {estimatedBeds}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground">병상</p>
                </motion.div>
              </div>

              {/* Status Message */}
              {hasConflict && (
                <div className="flex items-start gap-2.5 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    <span className="font-bold">{ambulancesEnRoute}대의 구급차</span>가 현재 이 병원으로 이동 중입니다. 
                    실제 가용 병상은 <span className="font-black text-amber-900 dark:text-amber-200">{estimatedBeds}개</span>일 수 있습니다.
                  </p>
                </div>
              )}

              {!hasConflict && ambulancesEnRoute === 0 && (
                <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    현재 이 병원으로 이동 중인 구급차가 없습니다.
                  </p>
                </div>
              )}

              <p className="text-[9px] text-muted-foreground/70 text-center mt-3">
                * 119 이송 정보는 포함되지 않았습니다.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShadowDemandCard;
