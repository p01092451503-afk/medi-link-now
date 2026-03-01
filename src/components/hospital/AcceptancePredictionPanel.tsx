import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Clock, CloudRain, Building2, Activity, ChevronDown, ChevronUp,
  AlertTriangle, ShieldCheck, Zap,
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
  const isGood = prediction.signal === 'green';
  const isCaution = prediction.signal === 'yellow';

  return (
    <div className={`p-4 rounded-2xl border ${
      isGood ? 'bg-secondary border-border' : isCaution ? 'bg-secondary border-border' : 'bg-destructive/5 border-destructive/15'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isGood ? 'bg-foreground' : isCaution ? 'bg-muted-foreground/60' : 'bg-destructive'
        }`}>
          <Zap className={`w-5 h-5 ${isGood || isCaution ? 'text-background' : 'text-destructive-foreground'}`} />
        </div>
        <div className="flex-1">
          <p className={`text-xl font-bold tracking-tight ${
            isGood ? 'text-foreground' : isCaution ? 'text-foreground' : 'text-destructive'
          }`}>
            수용 가능성 {prediction.probability}%
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            데이터 신뢰도: {prediction.confidence === 'high' ? '높음' : prediction.confidence === 'medium' ? '보통' : '낮음'}
            {' · '}{prediction.dataFreshness.sourcesActive}개 소스 활성
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Wait Time ──
const WaitTimeDisplay = ({ prediction }: { prediction: AcceptancePrediction }) => {
  const isLow = prediction.confidence === 'low';
  const waitText = isLow
    ? `${Math.max(5, prediction.estimatedWaitMin - 15)}~${prediction.estimatedWaitMin + 15}분`
    : `약 ${prediction.estimatedWaitMin}분`;

  const speedLabel = prediction.estimatedWaitMin <= 20 ? '빠름' : prediction.estimatedWaitMin <= 45 ? '보통' : '혼잡';

  return (
    <div className="p-4 rounded-2xl bg-secondary border border-border">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground font-medium">예상 대기시간</span>
        </div>
        <span className={`text-[12px] font-bold ${
          speedLabel === '빠름' ? 'text-foreground' : speedLabel === '보통' ? 'text-muted-foreground' : 'text-destructive'
        }`}>
          {speedLabel}
        </span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${
        speedLabel === '혼잡' ? 'text-destructive' : 'text-foreground'
      }`}>
        {waitText}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">
        ※ AI 예측 기반 추정치 (실시간 변동 가능)
      </p>
    </div>
  );
};

// ── Condition Grid (Toss style) ──
const conditionItems = [
  { key: 'cardiac' as const, label: '심정지' },
  { key: 'stroke' as const, label: '뇌졸중' },
  { key: 'trauma' as const, label: '중증외상' },
  { key: 'pediatric' as const, label: '소아응급' },
  { key: 'dialysis' as const, label: '투석' },
  { key: null, label: '일반응급' },
];

const ConditionGrid = ({ prediction }: { prediction: AcceptancePrediction }) => (
  <div className="grid grid-cols-3 gap-2">
    {conditionItems.map((item, i) => {
      const available = item.key ? prediction.conditionAcceptance[item.key] : prediction.probability >= 35;

      return (
        <div
          key={i}
          className={`flex items-center justify-between py-2.5 px-3 rounded-xl border transition-colors ${
            available
              ? 'bg-secondary border-border'
              : 'bg-destructive/5 border-destructive/15'
          }`}
        >
          <span className={`text-[13px] font-semibold ${
            available ? 'text-foreground' : 'text-destructive'
          }`}>
            {item.label}
          </span>
          <span className={`text-[12px] font-bold ${
            available ? 'text-foreground' : 'text-destructive'
          }`}>
            {available ? '가능' : '불가'}
          </span>
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
    <div className="rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-secondary/50 transition-colors"
      >
        <span className="text-[13px] font-semibold text-foreground">이 예측의 근거</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-3 border-t border-border pt-3">
              <FactorRow
                icon={Activity}
                label="현재 병상 점유율"
                value={`${prediction.breakdown.occupancyScore}%`}
                score={prediction.breakdown.occupancyScore}
              />
              <FactorRow
                icon={Clock}
                label="시간대 보정"
                value={`${prediction.breakdown.patternScore}점`}
                score={prediction.breakdown.patternScore}
              />
              <FactorRow
                icon={CloudRain}
                label="날씨 영향"
                value={`${prediction.breakdown.weatherScore}점`}
                score={prediction.breakdown.weatherScore}
              />
              <FactorRow
                icon={Building2}
                label="주변 응급실 과부하"
                value={`${prediction.breakdown.spilloverScore}점`}
                score={prediction.breakdown.spilloverScore}
              />
              <div className="pt-2 text-[10px] text-muted-foreground flex items-center gap-1.5 border-t border-border">
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
  <div className="flex items-center gap-2.5">
    <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
      <Icon className="w-3 h-3 text-muted-foreground" />
    </div>
    <span className="text-[12px] text-foreground flex-1">{label}</span>
    <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full bg-foreground/30 rounded-full transition-all"
        style={{ width: `${Math.min(100, score)}%` }}
      />
    </div>
    <span className="text-[11px] font-mono text-muted-foreground w-10 text-right">{value}</span>
  </div>
);

// ── Low Confidence Warning ──
const LowConfidenceWarning = () => (
  <div className="p-3.5 rounded-2xl bg-secondary border border-border">
    <div className="flex items-start gap-2.5">
      <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p className="text-[12px] text-muted-foreground leading-relaxed">
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
        <p className="text-[13px] font-semibold text-foreground mb-2">증상별 수용 가능 여부</p>
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
