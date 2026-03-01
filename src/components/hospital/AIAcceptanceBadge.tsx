import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAcceptancePrediction } from '@/hooks/useAcceptancePrediction';
import type { AcceptancePrediction } from '@/types/acceptance';

interface AIAcceptanceBadgeProps {
  hospitalId: number | undefined;
  className?: string;
}

function getStatusFromPrediction(p: AcceptancePrediction | null) {
  if (!p) return { status: 'no_data' as const, label: '데이터 수집 중', colors: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' } };
  if (p.probability >= 60) return { status: 'smooth' as const, label: '원활', colors: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' } };
  if (p.probability >= 35) return { status: 'delayed' as const, label: '지연 가능', colors: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' } };
  return { status: 'warning' as const, label: '거절 주의', colors: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' } };
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'smooth': return <TrendingUp className="w-3.5 h-3.5" />;
    case 'warning': return <TrendingDown className="w-3.5 h-3.5" />;
    default: return <Minus className="w-3.5 h-3.5" />;
  }
};

const AIAcceptanceBadge = ({ hospitalId, className = '' }: AIAcceptanceBadgeProps) => {
  const { data: prediction, isLoading } = useAcceptancePrediction(hospitalId);
  const { status, label, colors } = getStatusFromPrediction(prediction);

  const tooltipContent = prediction ? (
    <div className="space-y-2 p-1">
      <p className="font-semibold text-sm">AI 수용 예측 v3</p>
      <p className="text-xs leading-relaxed">
        4계층 분석 기반 수용 확률: <span className="font-bold">{prediction.probability}%</span>
      </p>
      <p className="text-[10px] text-muted-foreground">
        신뢰도: {prediction.confidence === 'high' ? '높음' : prediction.confidence === 'medium' ? '보통' : '낮음'}
        {' '}({prediction.dataFreshness.sourcesActive}개 소스)
      </p>
    </div>
  ) : (
    <div className="space-y-1 p-1">
      <p className="font-semibold text-sm">AI 수용 예측</p>
      <p className="text-xs text-muted-foreground">예측 데이터를 수집 중입니다.</p>
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
            {prediction && (
              <span className="ml-0.5 text-[10px] opacity-70">({prediction.probability}%)</span>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px] p-3" sideOffset={5}>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AIAcceptanceBadge;
