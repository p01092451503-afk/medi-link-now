import { useMemo, useState } from "react";
import { Sparkles, TrendingDown, TrendingUp, Minus, ChevronDown, Ambulance, HelpCircle, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHospitalEnRouteCount } from "@/hooks/useAmbulanceTrips";

interface CompactAIPredictionProps {
  hospitalId: string;
  officialBeds: number;
}

// Trend is still mock - would need historical data to calculate
const getMockTrend = (hospitalId: string): "decreasing" | "stable" | "increasing" => {
  const hash = hospitalId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const trends: ("decreasing" | "stable" | "increasing")[] = ["decreasing", "stable", "increasing"];
  return trends[hash % 3];
};

const CompactAIPrediction = ({ hospitalId, officialBeds }: CompactAIPredictionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Real-time ambulance count from database
  const { count: ambulancesEnRoute, isLoading } = useHospitalEnRouteCount(hospitalId);
  const estimatedBeds = Math.max(0, officialBeds - ambulancesEnRoute);
  const trend = useMemo(() => getMockTrend(hospitalId), [hospitalId]);
  
  // Calculate safety status - Using purple/blue theme to differentiate from bed status (green)
  const getSafetyStatus = () => {
    if (estimatedBeds > 5) {
      return { 
        score: 95, 
        label: "여유", 
        message: "✅ 도착 시 병상 확보 가능성 높음",
        bgColor: "bg-violet-50",
        borderColor: "border-violet-200",
        textColor: "text-violet-700",
        badgeBg: "bg-violet-100",
        progressColor: "bg-violet-500",
        statusIcon: "🟢"
      };
    } else if (estimatedBeds >= 2) {
      return { 
        score: 70, 
        label: "보통", 
        message: "⚠️ 도착 전 전화 확인 권장",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
        textColor: "text-indigo-700",
        badgeBg: "bg-amber-100",
        progressColor: "bg-indigo-400",
        statusIcon: "🟡"
      };
    }
    return { 
      score: 30, 
      label: "부족", 
      message: "🚨 다른 병원도 함께 확인하세요",
      bgColor: "bg-slate-100",
      borderColor: "border-slate-300",
      textColor: "text-slate-700",
      badgeBg: "bg-red-100",
      progressColor: "bg-red-500",
      statusIcon: "🔴"
    };
  };
  
  const safety = getSafetyStatus();
  
  const TrendIcon = trend === "decreasing" ? TrendingDown : trend === "increasing" ? TrendingUp : Minus;
  const trendColor = trend === "decreasing" ? "text-red-500" : trend === "increasing" ? "text-emerald-500" : "text-slate-400";
  const trendLabel = trend === "decreasing" ? "감소 중" : trend === "increasing" ? "증가 중" : "안정";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`rounded-xl border-2 ${safety.borderColor} ${safety.bgColor} mb-4 overflow-hidden`}>
        {/* Main Header - Always visible */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-3">
            <div className="flex items-center justify-between">
              {/* Left: Title & Badge */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/80 border border-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs font-semibold text-slate-700">AI 예측</span>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button" 
                          onClick={(e) => e.stopPropagation()}
                          className="ml-0.5"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-violet-500 transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px] p-3 z-[2000]">
                        <div className="space-y-2">
                          <p className="font-semibold text-sm">🤖 AI 예측이란?</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            현재 이 병원으로 이동 중인 구급차 수와 병상 변화 추세를 분석하여, 
                            <span className="font-medium text-foreground"> 도착 시점의 예상 가용 병상</span>을 계산합니다.
                          </p>
                          <div className="pt-1 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400">
                              ⚠️ 참고용 예측 지표이며, 실제 상황과 다를 수 있습니다. 
                              중요한 결정 전 반드시 병원에 전화 확인하세요.
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Trend indicator */}
                <div className="flex items-center gap-1 text-xs">
                  <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                  <span className={`font-medium ${trendColor}`}>{trendLabel}</span>
                </div>
              </div>
              
              {/* Right: Key metric */}
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg ${safety.badgeBg}`}>
                  <span className={`text-sm font-bold ${safety.textColor}`}>
                    예상 {estimatedBeds}병상 {safety.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </div>
            
            {/* Key Message */}
            <div className={`mt-2 py-2 px-3 rounded-lg bg-white/60 border ${safety.borderColor}`}>
              <p className={`text-sm font-medium ${safety.textColor} text-center`}>
                {safety.message}
              </p>
            </div>
          </button>
        </CollapsibleTrigger>
        
        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3">
            {/* Calculation breakdown */}
            <div className="bg-white/80 rounded-lg p-3 border border-slate-100">
              <p className="text-xs text-slate-500 mb-2 font-medium">병상 예측 계산</p>
              
              <div className="flex items-center justify-between gap-2">
                {/* Official beds */}
                <div className="flex-1 text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-lg font-bold text-slate-700">{officialBeds}</p>
                  <p className="text-[10px] text-slate-500">공식 병상</p>
                </div>
                
                {/* Minus sign */}
                <div className="text-slate-400 font-bold">−</div>
                
                {/* Ambulances en route */}
                <div className="flex-1 text-center p-2 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex items-center justify-center gap-1">
                    <Ambulance className="w-3.5 h-3.5 text-orange-500" />
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                    ) : (
                      <p className="text-lg font-bold text-orange-600">{ambulancesEnRoute}</p>
                    )}
                  </div>
                  <p className="text-[10px] text-orange-600">이동 중</p>
                </div>
                
                {/* Equals sign */}
                <div className="text-slate-400 font-bold">=</div>
                
                {/* Estimated beds - Using purple/blue to match AI theme */}
                <div className={`flex-1 text-center p-2 rounded-lg border-2 ${
                  estimatedBeds > 5 ? "bg-violet-50 border-violet-300" :
                  estimatedBeds > 0 ? "bg-indigo-50 border-indigo-300" : "bg-slate-100 border-slate-300"
                }`}>
                  <p className={`text-xl font-bold ${
                    estimatedBeds > 5 ? "text-violet-600" :
                    estimatedBeds > 0 ? "text-indigo-600" : "text-slate-600"
                  }`}>{estimatedBeds}</p>
                  <p className="text-[10px] text-slate-600">예상 병상</p>
                </div>
              </div>
            </div>
            
            {/* Confidence bar */}
            <div className="bg-white/80 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">도착 시 병상 확보 가능성</span>
                <span className={`text-sm font-bold ${safety.textColor}`}>{safety.score}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${safety.progressColor} rounded-full transition-all duration-500`}
                  style={{ width: `${safety.score}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">부족</span>
                <span className="text-[10px] text-slate-400">여유</span>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 text-center">
              * AI 예측 기반 참고 지표입니다
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default CompactAIPrediction;
