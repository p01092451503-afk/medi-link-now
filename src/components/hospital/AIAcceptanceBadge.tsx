import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useAcceptancePrediction,
  getAcceptanceStatus,
  getAcceptanceLabel,
  getAcceptanceColor,
  AcceptanceStatus
} from '@/hooks/useAcceptancePrediction';

interface AIAcceptanceBadgeProps {
  hospitalId: number | undefined;
  className?: string;
}

const StatusIcon = ({ status }: { status: AcceptanceStatus }) => {
  switch (status) {
    case 'smooth':
      return <TrendingUp className="w-3.5 h-3.5" />;
    case 'warning':
      return <TrendingDown className="w-3.5 h-3.5" />;
    default:
      return <Minus className="w-3.5 h-3.5" />;
  }
};

const AIAcceptanceBadge = ({ hospitalId, className = '' }: AIAcceptanceBadgeProps) => {
  const { data: prediction, isLoading } = useAcceptancePrediction(hospitalId);

  const status = prediction 
    ? getAcceptanceStatus(prediction.acceptance_rate, prediction.total_entries)
    : 'no_data';
  const label = getAcceptanceLabel(status);
  const colors = getAcceptanceColor(status);

  const tooltipContent = prediction && prediction.total_entries > 0 ? (
    <div className="space-y-2 p-1">
      <p className="font-semibold text-sm">AI 수용 예측</p>
      <p className="text-xs leading-relaxed">
        최근 {prediction.recent_analysis.analysis_period_hours}시간 동안{' '}
        <span className="font-bold">{prediction.recent_analysis.total_vehicles}대</span>의 
        차량이 진입했으나{' '}
        <span className="font-bold text-red-500">{prediction.recent_analysis.rejected_vehicles}대</span>가 
        다른 곳으로 이동했습니다.
      </p>
      <div className="pt-1 border-t border-gray-200">
        <p className="text-[10px] text-muted-foreground">
          수용 확률: {prediction.acceptance_rate}%
        </p>
      </div>
    </div>
  ) : (
    <div className="space-y-1 p-1">
      <p className="font-semibold text-sm">AI 수용 예측</p>
      <p className="text-xs text-muted-foreground">
        최근 3시간 내 방문 기록이 없어<br/>
        아직 예측 데이터를 수집 중입니다.
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200 animate-pulse ${className}`}>
        <Brain className="w-3.5 h-3.5" />
        <span>분석 중...</span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border} cursor-pointer transition-all hover:shadow-md ${className}`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>AI 수용 예측</span>
            <span className="font-bold">{label}</span>
            <StatusIcon status={status} />
            {prediction && prediction.total_entries > 0 && (
              <span className="ml-0.5 text-[10px] opacity-70">
                ({prediction.acceptance_rate}%)
              </span>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-[280px] p-3"
          sideOffset={5}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AIAcceptanceBadge;
