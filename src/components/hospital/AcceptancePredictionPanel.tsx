import { motion } from 'framer-motion';
import { Brain, Clock, TrendingDown, TrendingUp, Minus, CloudRain, Timer, Building2, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAcceptancePrediction, AcceptancePrediction } from '@/hooks/useAcceptancePrediction';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AcceptancePredictionPanelProps {
  hospitalId: number | undefined;
}

const ConfidenceBadge = ({ level }: { level: 'high' | 'medium' | 'low' }) => {
  const config = {
    high: { label: '높음', className: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' },
    medium: { label: '보통', className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400' },
    low: { label: '낮음', className: 'bg-muted text-muted-foreground' },
  };
  const c = config[level];
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.className}`}>
      신뢰도 {c.label}
    </span>
  );
};

const GaugeBar = ({ value, label }: { value: number; label: string }) => {
  const getColor = (v: number) => {
    if (v >= 70) return 'bg-green-500';
    if (v >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-sm font-bold text-foreground">{value}%</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${getColor(value)}`}
        />
      </div>
    </div>
  );
};

const FactorItem = ({ icon: Icon, label, score }: { icon: React.ElementType; label: string; score: number }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
    <span className="text-[11px] text-muted-foreground flex-1">{label}</span>
    <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full bg-foreground/40 rounded-full transition-all"
        style={{ width: `${score}%` }}
      />
    </div>
    <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{score}</span>
  </div>
);

const AcceptancePredictionPanel = ({ hospitalId }: AcceptancePredictionPanelProps) => {
  const { data: prediction, isLoading } = useAcceptancePrediction(hospitalId);

  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl bg-secondary border border-border animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        <div className="h-3 w-full bg-muted rounded-full mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-3/4 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="p-4 rounded-2xl bg-secondary border border-border">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">예측 데이터를 수집 중입니다</span>
        </div>
      </div>
    );
  }

  const prob = prediction.acceptance_probability;
  const waitMin = prediction.estimated_wait_minutes;
  const forecast = prediction.forecast_30min;
  const diff = forecast - prob;

  const formatWait = () => {
    if (prediction.confidence === 'low') {
      const low = Math.max(5, waitMin - 15);
      const high = waitMin + 15;
      return `~${low}–${high}분`;
    }
    return `${waitMin}분`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-secondary border border-border space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-foreground" />
          <h4 className="text-sm font-bold text-foreground">AI 수용 예측</h4>
          <span className="text-[9px] font-bold text-background bg-foreground px-2 py-0.5 rounded-full">v2</span>
        </div>
        <ConfidenceBadge level={prediction.confidence} />
      </div>

      {/* Main Gauge */}
      <GaugeBar value={prob} label="현재 수용 가능성" />

      {/* Wait & Forecast */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-background border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">예상 대기</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatWait()}</p>
        </div>
        <div className="p-3 rounded-xl bg-background border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">30분 후</span>
          </div>
          <div className="flex items-center gap-1.5">
            <p className="text-lg font-bold text-foreground">{forecast}%</p>
            {diff > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            ) : diff < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Factor Breakdown */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="w-full text-left">
              <div className="space-y-1.5 pt-2 border-t border-border">
                <p className="text-[10px] font-medium text-muted-foreground mb-2">예측 근거 (탭하여 상세)</p>
                <FactorItem icon={Activity} label="병상 가용률" score={prediction.factors.bed_availability_score} />
                <FactorItem icon={Clock} label="시간대 패턴" score={prediction.factors.time_pattern_score} />
                <FactorItem icon={Building2} label="주변 경쟁" score={prediction.factors.nearby_competition_score} />
                <FactorItem icon={CloudRain} label="기상 영향" score={prediction.factors.weather_score} />
                <FactorItem icon={TrendingUp} label="과거 수용률" score={prediction.factors.historical_acceptance_score} />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px] p-3">
            <div className="space-y-1.5 text-xs">
              <p className="font-semibold">가중치 알고리즘</p>
              <p>병상 35% · 과거수용 25% · 시간대 15% · 경쟁 15% · 기상 10%</p>
              <p className="text-muted-foreground mt-1">Open-Meteo API로 실시간 날씨 반영</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
};

export default AcceptancePredictionPanel;
