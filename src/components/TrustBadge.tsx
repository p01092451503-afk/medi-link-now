import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TrustBadge = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="absolute top-0 left-0 right-0 z-[1002] flex justify-center pt-1 pointer-events-none"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-slate-700/40 shadow-sm pointer-events-auto cursor-help">
            <ShieldCheck className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
              ⚡ Powered by NEDIS & 119 Data
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-[260px] text-xs leading-relaxed p-3"
        >
          <p className="font-semibold mb-1">📡 공공 데이터 기반 실시간 정보</p>
          <ul className="space-y-0.5 text-muted-foreground">
            <li>• <strong>NEDIS</strong>: 국립응급의료정보망 – 응급실 병상 현황</li>
            <li>• <strong>119</strong>: 소방청 구급 통계 – 이송·출동 데이터</li>
          </ul>
          <p className="mt-1.5 text-[10px] text-muted-foreground/70">
            데이터는 실시간으로 갱신되며, API 상태에 따라 지연될 수 있습니다.
          </p>
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
};

export default TrustBadge;
