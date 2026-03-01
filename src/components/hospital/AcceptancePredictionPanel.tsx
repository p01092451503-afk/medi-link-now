import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Clock, CloudRain, Building2, Activity, ChevronDown, ChevronUp,
  AlertTriangle, Heart, Droplet, Baby, Truck, ShieldCheck,
} from 'lucide-react';
import { useAcceptancePrediction } from '@/hooks/useAcceptancePrediction';
import { Hospital } from '@/data/hospitals';
import { AcceptancePrediction } from '@/types/acceptance';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Props {
  hospitalId: number | undefined;
  hospital?: Hospital | null;
  allHospitals?: Hospital[];
}

// ── Signal Banner ──
const SignalBanner = ({ prediction }: { prediction: AcceptancePrediction }) => {
  const signalEmoji = prediction.signal === 'green' ? '🟢' : prediction.signal === 'yellow' ? '🟡' : '🔴';
  const signalBg =
    prediction.signal === 'green'
      ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
      : prediction.signal === 'yellow'
      ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
  const signalText =
    prediction.signal === 'green' ? 'text-green-700 dark:text-green-400'
    : prediction.signal === 'yellow' ? 'text-orange-700 dark:text-orange-400'
    : 'text-red-700 dark:text-red-400';

  return (
    <div className={`p-4 rounded-2xl border ${signalBg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{signalEmoji}</span>
          <div>
            <p className={`text-xl font-bold ${signalText}`}>
              수용 가능성 {prediction.probability}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              데이터 신뢰도: {prediction.confidence === 'high' ? '높음' : prediction.confidence === 'medium' ? '보통' : '낮음'}
              {' '}({prediction.dataFreshness.sourcesActive}개 소스)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Wait Time ──
const WaitTimeDisplay = ({ prediction }: { prediction: AcceptancePrediction }) => {
  const waitText =
    prediction.confidence === 'low'
      ? `${Math.max(5, prediction.estimatedWaitMin - 15)}~${prediction.estimatedWaitMin + 15}분 (추정)`
      : `약 ${prediction.estimatedWaitMin}분`;

  return (
    <div className="p-3 rounded-xl bg-secondary border border-border">
      <div className="flex items-center gap-1.5 mb-1">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">예상 대기</span>
      </div>
      <p className="text-lg font-bold text-foreground">{waitText}</p>
    </div>
  );
};

// ── Condition Grid ──
const conditionItems = [
  { key: 'cardiac' as const, label: '심정지', emoji: '🫀' },
  { key: 'stroke' as const, label: '뇌졸중', emoji: '🧠' },
  { key: 'trauma' as const, label: '중증외상', emoji: '🚨' },
  { key: 'pediatric' as const, label: '소아응급', emoji: '👶' },
  { key: 'dialysis' as const, label: '투석', emoji: '💉' },
  { key: null, label: '일반응급', emoji: '✅' },
];

const ConditionGrid = ({ prediction }: { prediction: AcceptancePrediction }) => (
  <div className="grid grid-cols-3 gap-2">
    {conditionItems.map((item, i) => {
      const available = item.key ? prediction.conditionAcceptance[item.key] : prediction.probability >= 35;
      const colorClass = available
        ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800';

      return (
        <div
          key={i}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center ${colorClass}`}
        >
          <span className="text-lg">{item.emoji}</span>
          <span className="text-[11px] font-medium">{item.label}</span>
          <span className="text-[10px] font-bold">{available ? '가능' : '불가'}</span>
        </div>
      );
    })}
  </div>
);

// ── Breakdown Section ──
const BreakdownSection = ({ prediction }: { prediction: AcceptancePrediction }) => {
  const [open, setOpen] = useState(false);

  const lastUpdatedText = formatDistanceToNow(prediction.dataFreshness.lastUpdated, {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
      >
        <span className="text-xs font-semibold text-foreground">이 예측의 근거</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
              <FactorRow icon={Activity} label="현재 병상 점유율" value={`${prediction.breakdown.occupancyScore}%`} score={prediction.breakdown.occupancyScore} />
              <FactorRow icon={Clock} label="시간대 보정" value={`패턴 ${prediction.breakdown.patternScore}점`} score={prediction.breakdown.patternScore} />
              <FactorRow icon={CloudRain} label="날씨 영향" value={`환경 ${prediction.breakdown.weatherScore}점`} score={prediction.breakdown.weatherScore} />
              <FactorRow icon={Building2} label="주변 응급실 과부하" value={`연쇄 ${prediction.breakdown.spilloverScore}점`} score={prediction.breakdown.spilloverScore} />
              <div className="pt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                마지막 업데이트: {lastUpdatedText}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FactorRow = ({ icon: Icon, label, value, score }: { icon: React.ElementType; label: string; value: string; score: number }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
    <span className="text-[11px] text-muted-foreground flex-1">{label}</span>
    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full bg-foreground/40 rounded-full"
        style={{ width: `${Math.min(100, score)}%` }}
      />
    </div>
    <span className="text-[10px] font-mono text-muted-foreground w-14 text-right">{value}</span>
  </div>
);

// ── Low Confidence Warning ──
const LowConfidenceWarning = () => (
  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
    <div className="flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
      <p className="text-[11px] text-orange-700 dark:text-orange-300 leading-relaxed">
        실시간 데이터 연결이 제한되어 통계 기반으로 추정합니다.
        반드시 병원에 직접 확인하세요.
      </p>
    </div>
  </div>
);

// ── Main Panel ──
const AcceptancePredictionPanel = ({ hospitalId, hospital, allHospitals }: Props) => {
  const { data: prediction, isLoading } = useAcceptancePrediction(hospitalId, hospital, allHospitals);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-foreground" />
        <h4 className="text-sm font-bold text-foreground">AI 4계층 수용 예측</h4>
        <span className="text-[9px] font-bold text-background bg-foreground px-2 py-0.5 rounded-full">v3</span>
      </div>

      {/* ① Signal Banner */}
      <SignalBanner prediction={prediction} />

      {/* ② Wait Time */}
      <WaitTimeDisplay prediction={prediction} />

      {/* ③ Condition Grid */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">증상별 수용 가능 여부</p>
        <ConditionGrid prediction={prediction} />
      </div>

      {/* ④ Breakdown */}
      <BreakdownSection prediction={prediction} />

      {/* ⑤ Low confidence warning */}
      {prediction.confidence === 'low' && <LowConfidenceWarning />}
    </motion.div>
  );
};

export default AcceptancePredictionPanel;
