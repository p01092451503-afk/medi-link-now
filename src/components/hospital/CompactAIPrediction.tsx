import { useMemo } from "react";
import { Sparkles, TrendingDown, TrendingUp, Minus, Users, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface CompactAIPredictionProps {
  hospitalId: string;
  officialBeds: number;
}

// Mock functions
const getMockAmbulancesEnRoute = (hospitalId: string): number => {
  const hash = hospitalId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 4;
};

const getMockTrend = (hospitalId: string): "decreasing" | "stable" | "increasing" => {
  const hash = hospitalId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const trends: ("decreasing" | "stable" | "increasing")[] = ["decreasing", "stable", "increasing"];
  return trends[hash % 3];
};

const CompactAIPrediction = ({ hospitalId, officialBeds }: CompactAIPredictionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const ambulancesEnRoute = useMemo(() => getMockAmbulancesEnRoute(hospitalId), [hospitalId]);
  const estimatedBeds = Math.max(0, officialBeds - ambulancesEnRoute);
  const trend = useMemo(() => getMockTrend(hospitalId), [hospitalId]);
  
  // Calculate safety status
  const getSafetyStatus = () => {
    if (estimatedBeds > 5) {
      return { score: 95, label: "안전", status: "safe" as const, color: "text-emerald-600", bg: "bg-emerald-500" };
    } else if (estimatedBeds >= 2) {
      return { score: 70, label: "주의", status: "caution" as const, color: "text-amber-600", bg: "bg-amber-500" };
    }
    return { score: 30, label: "위험", status: "danger" as const, color: "text-red-600", bg: "bg-red-500" };
  };
  
  const safety = getSafetyStatus();
  
  const TrendIcon = trend === "decreasing" ? TrendingDown : trend === "increasing" ? TrendingUp : Minus;
  const trendColor = trend === "decreasing" ? "text-red-500" : trend === "increasing" ? "text-emerald-500" : "text-slate-400";
  const trendLabel = trend === "decreasing" ? "-3/h" : trend === "increasing" ? "+2/h" : "안정";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Compact Header - Always visible */}
      <CollapsibleTrigger asChild>
        <button className="w-full mb-4">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-[1px]">
            <div className="relative bg-gradient-to-r from-violet-950/95 via-purple-950/95 to-indigo-950/95 rounded-[11px] px-3 py-2.5">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-indigo-500/10 animate-pulse rounded-[11px]" />
              
              <div className="relative flex items-center justify-between">
                {/* Left: AI Badge & Main Status */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-violet-300" />
                    <span className="text-[11px] font-semibold text-white/90">AI</span>
                  </div>
                  
                  {/* Safety Score Badge */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                    safety.status === "safe" ? "bg-emerald-500/20" :
                    safety.status === "caution" ? "bg-amber-500/20" : "bg-red-500/20"
                  }`}>
                    {safety.status === "safe" ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : safety.status === "caution" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className={`text-xs font-bold ${
                      safety.status === "safe" ? "text-emerald-400" :
                      safety.status === "caution" ? "text-amber-400" : "text-red-400"
                    }`}>
                      {safety.score}%
                    </span>
                  </div>
                </div>
                
                {/* Right: Quick Stats */}
                <div className="flex items-center gap-3">
                  {/* Ambulances en route */}
                  {ambulancesEnRoute > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs font-medium text-orange-300">-{ambulancesEnRoute}</span>
                    </div>
                  )}
                  
                  {/* Trend */}
                  <div className="flex items-center gap-1">
                    <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                    <span className={`text-xs font-medium ${trendColor}`}>{trendLabel}</span>
                  </div>
                  
                  {/* Estimated beds */}
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${
                    estimatedBeds > 5 ? "bg-emerald-500/30" :
                    estimatedBeds > 0 ? "bg-amber-500/30" : "bg-red-500/30"
                  }`}>
                    <span className={`text-sm font-bold ${
                      estimatedBeds > 5 ? "text-emerald-300" :
                      estimatedBeds > 0 ? "text-amber-300" : "text-red-300"
                    }`}>
                      {estimatedBeds}
                    </span>
                    <span className="text-[10px] text-white/60">예상</span>
                  </div>
                  
                  {/* Expand indicator */}
                  <ChevronDown className={`w-4 h-4 text-white/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </div>
            </div>
          </div>
        </button>
      </CollapsibleTrigger>
      
      {/* Expanded Details */}
      <CollapsibleContent>
        <div className="mb-4 -mt-2 pt-3 px-3 pb-3 bg-gradient-to-b from-purple-50 to-white rounded-b-xl border border-t-0 border-purple-100">
          {/* Safety Message */}
          <div className={`p-2.5 rounded-lg mb-3 ${
            safety.status === "safe" ? "bg-emerald-50 border border-emerald-200" :
            safety.status === "caution" ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"
          }`}>
            <p className={`text-xs font-medium text-center ${safety.color}`}>
              {safety.status === "safe" 
                ? "✅ 지금 출발해도 안전합니다" 
                : safety.status === "caution" 
                ? "⚠️ 도착 전 전화 확인을 권장합니다"
                : "🚨 다른 병원도 확인하세요"}
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-lg p-2 border border-slate-100">
              <p className="text-lg font-bold text-orange-600">{ambulancesEnRoute}</p>
              <p className="text-[10px] text-muted-foreground">이동 중</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-slate-100">
              <p className="text-lg font-bold text-slate-600">{officialBeds}</p>
              <p className="text-[10px] text-muted-foreground">공식</p>
            </div>
            <div className={`rounded-lg p-2 border-2 ${
              estimatedBeds > 5 ? "bg-emerald-50 border-emerald-300" :
              estimatedBeds > 0 ? "bg-amber-50 border-amber-300" : "bg-red-50 border-red-300"
            }`}>
              <p className={`text-lg font-bold ${
                estimatedBeds > 5 ? "text-emerald-600" :
                estimatedBeds > 0 ? "text-amber-600" : "text-red-600"
              }`}>{estimatedBeds}</p>
              <p className="text-[10px] text-muted-foreground">예상</p>
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground text-center mt-2 opacity-70">
            * AI 예측 기반 참고 지표
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CompactAIPrediction;
