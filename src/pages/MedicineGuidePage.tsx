import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Thermometer,
  HeartPulse,
  MapPin,
  AlertTriangle,
  Info,
  Pill,
  Droplets,
  Scale,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import DoseTimerCard from "@/components/DoseTimerCard";
import { useNearbyPharmacies } from "@/hooks/useNearbyPharmacies";
import NearbyPharmacyListSheet from "@/components/NearbyPharmacyListSheet";
import PharmacyBottomSheet from "@/components/PharmacyBottomSheet";

type TabType = "fever" | "stomach";

/* ───────── Dosage helpers ───────── */
const calcAcetaminophen = (kg: number) => {
  const mgDose = kg * 10; // 10-15 mg/kg, using 10 as conservative
  const mlSyrup = +(kg * 0.4).toFixed(1); // typical 32mg/ml concentration
  return { mgDose, mlSyrup };
};
const calcIbuprofen = (kg: number) => {
  const mgDose = kg * 5; // 5-10 mg/kg, using 5 as conservative
  const mlSyrup = +(kg * 0.25).toFixed(1); // typical 20mg/ml concentration
  return { mgDose, mlSyrup };
};

const MedicineGuidePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("fever");
  const [weightInput, setWeightInput] = useState("");
  const [pharmacySheetOpen, setPharmacySheetOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<import("@/hooks/useNearbyPharmacies").NearbyPharmacy | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const weight = parseFloat(weightInput) || 0;
  const validWeight = weight >= 3 && weight <= 50;

  const { pharmacies, isLoading: pharmaciesLoading, error: pharmaciesError } = useNearbyPharmacies({
    enabled: pharmacySheetOpen && !!userLocation,
    userLocation,
  });

  const handleFindPharmacy = useCallback(() => {
    if (userLocation) {
      setPharmacySheetOpen(true);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setPharmacySheetOpen(true);
        setIsLocating(false);
      },
      (err) => {
        console.error("[MedicineGuidePage] Geolocation error:", err);
        toast.error("위치 정보를 가져올 수 없습니다", {
          description: "브라우저 설정에서 위치 권한을 허용해주세요.",
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [userLocation]);

  const acetaminophen = useMemo(() => calcAcetaminophen(weight), [weight]);
  const ibuprofen = useMemo(() => calcIbuprofen(weight), [weight]);

  const tabs: { id: TabType; label: string; emoji: string; icon: typeof Thermometer }[] = [
    { id: "fever", label: "발열", emoji: "🔥", icon: Thermometer },
    { id: "stomach", label: "복통", emoji: "🤢", icon: HeartPulse },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-blue-100 dark:border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm font-medium"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            돌아가기
          </button>
          <span className="font-logo font-extrabold text-slate-800 dark:text-white">
            💊 약 가이드
          </span>
          <div className="w-16" />
        </div>
      </header>

      <main className="px-5 pb-20 max-w-lg mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-6 pb-5"
        >
          <h1 className="text-xl font-extrabold text-foreground mb-1.5">
            소아 응급 약 가이드
          </h1>
          <p className="text-sm text-muted-foreground">
            병원 가기 전, 집에서 먼저 대처하세요
          </p>
        </motion.div>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-200 border-2 ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25"
                  : "bg-white dark:bg-slate-800 text-muted-foreground border-blue-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-slate-600"
              }`}
            >
              <span className="mr-1.5">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "fever" ? (
            <motion.div
              key="fever"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Medicine Comparison */}
              <div className="grid grid-cols-2 gap-3">
                {/* Acetaminophen */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-red-200 dark:border-red-900/50 p-4 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-3">
                    <Thermometer className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="text-[10px] font-bold text-red-500 dark:text-red-400 mb-0.5 tracking-wide">RED CHAMP</p>
                  <h3 className="text-sm font-extrabold text-foreground mb-1">
                    아세트아미노펜
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    타이레놀, 챔프시럽
                  </p>
                  <div className="mt-3 pt-3 border-t border-red-100 dark:border-red-900/30 text-left space-y-1.5">
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">•</span>
                      4~6시간 간격 투여
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">•</span>
                      생후 4개월부터 사용 가능
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">•</span>
                      하루 최대 5회
                    </p>
                  </div>
                </div>

                {/* Ibuprofen */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-200 dark:border-blue-900/50 p-4 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-3">
                    <Droplets className="w-7 h-7 text-blue-500" />
                  </div>
                  <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-0.5 tracking-wide">BLUE CHAMP</p>
                  <h3 className="text-sm font-extrabold text-foreground mb-1">
                    이부프로펜
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    부루펜시럽, 맥시부펜
                  </p>
                  <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/30 text-left space-y-1.5">
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">•</span>
                      6~8시간 간격 투여
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">•</span>
                      생후 6개월부터 사용 가능
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">•</span>
                      하루 최대 4회
                    </p>
                  </div>
                </div>
              </div>

              {/* Dosage Calculator */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-100 dark:border-slate-700 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-blue-500" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">용량 계산기</h3>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    아이 체중
                  </label>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder="예: 12"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      className="pr-8 rounded-xl border-2 border-blue-100 dark:border-slate-600 focus:border-blue-400 text-center text-lg font-bold"
                      min={3}
                      max={50}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      kg
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {validWeight && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2.5 overflow-hidden"
                    >
                      {/* Acetaminophen Result */}
                      <div className="flex items-center justify-between p-3.5 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/40">
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-semibold text-foreground">아세트아미노펜</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-red-600 dark:text-red-400">
                            {acetaminophen.mlSyrup}ml
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            ({acetaminophen.mgDose}mg)
                          </p>
                        </div>
                      </div>

                      {/* Ibuprofen Result */}
                      <div className="flex items-center justify-between p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-semibold text-foreground">이부프로펜</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                            {ibuprofen.mlSyrup}ml
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            ({ibuprofen.mgDose}mg)
                          </p>
                        </div>
                      </div>

                      <p className="text-[10px] text-center text-muted-foreground pt-1">
                        * 일반적인 소아용 시럽 기준입니다. 제품별 농도가 다를 수 있습니다.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dose Timer */}
              <DoseTimerCard />

              {/* Tip Box */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border-2 border-amber-200 dark:border-amber-800/50">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                    교차 복용 팁
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    해열제 복용 2시간 후에도 열이 내리지 않으면, <span className="font-bold">다른 계열</span>의 해열제로 교차 복용하세요.
                    (예: 타이레놀 → 2시간 후 → 부루펜)
                  </p>
                </div>
              </div>

              {/* When to go to ER */}
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-2xl border-2 border-red-200 dark:border-red-800/50">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-800 dark:text-red-300 mb-1">
                    병원에 가야 하는 경우
                  </p>
                  <ul className="text-[11px] text-red-700 dark:text-red-400 leading-relaxed space-y-1">
                    <li>• 38.5°C 이상 고열이 24시간 이상 지속</li>
                    <li>• 생후 3개월 미만 아기의 38°C 이상 발열</li>
                    <li>• 경련, 발진, 심한 보챔 동반 시</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="stomach"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* OTC Medicines */}
              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-green-200 dark:border-green-900/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center">
                      <Pill className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-foreground">백초시럽</h3>
                      <p className="text-[11px] text-muted-foreground">소화 불량 · 체했을 때</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 pl-1">
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5">•</span>
                      소화불량, 더부룩함에 효과적
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5">•</span>
                      연령별 용량을 확인하세요
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5">•</span>
                      식후 30분에 복용
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-200 dark:border-purple-900/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
                      <Droplets className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-foreground">키즈활명수</h3>
                      <p className="text-[11px] text-muted-foreground">과식 · 구역질 · 배탈</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 pl-1">
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-purple-400 mt-0.5">•</span>
                      과식, 배탈, 가벼운 구역질에 사용
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-purple-400 mt-0.5">•</span>
                      만 3세 이상부터 복용 가능
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-purple-400 mt-0.5">•</span>
                      1일 3회, 식후 복용
                    </p>
                  </div>
                </div>
              </div>

              {/* ER Warning Banner */}
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-2xl border-2 border-red-300 dark:border-red-800/60">
                <div className="flex items-center gap-2 mb-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-sm font-extrabold text-red-700 dark:text-red-300">
                    즉시 응급실 방문이 필요한 경우
                  </h3>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 leading-relaxed">
                    <span className="font-black text-red-500 mt-0.5">⚠️</span>
                    오른쪽 아랫배가 심하게 아플 때 (맹장염 의심)
                  </li>
                  <li className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 leading-relaxed">
                    <span className="font-black text-red-500 mt-0.5">⚠️</span>
                    대변에 피가 섞여 나올 때
                  </li>
                  <li className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 leading-relaxed">
                    <span className="font-black text-red-500 mt-0.5">⚠️</span>
                    심한 구토와 함께 탈수 증상이 있을 때
                  </li>
                  <li className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 leading-relaxed">
                    <span className="font-black text-red-500 mt-0.5">⚠️</span>
                    배를 만지면 딱딱하고 심하게 울 때
                  </li>
                </ul>
              </div>

              {/* Hydration Tip */}
              <div className="flex items-start gap-3 p-4 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border-2 border-sky-200 dark:border-sky-800/50">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-sky-800 dark:text-sky-300 mb-1">
                    수분 보충이 중요해요
                  </p>
                  <p className="text-[11px] text-sky-700 dark:text-sky-400 leading-relaxed">
                    구토·설사 시 이온음료나 경구수액(ORS)을 <span className="font-bold">소량씩 자주</span> 먹이세요.
                    한 번에 많이 먹이면 다시 토할 수 있어요.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <div className="mt-6 p-3 bg-muted/50 rounded-xl">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            ※ 이 정보는 일반적인 가이드이며 의료 전문가의 진단을 대체하지 않습니다.
            <br />
            증상이 심하거나 판단이 어려우면 반드시 의사와 상담하세요.
          </p>
        </div>
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-blue-100 dark:border-slate-800 p-4 safe-bottom">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleFindPharmacy}
            disabled={isLocating}
            className="w-full py-6 rounded-2xl text-base font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 border-0"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                위치 확인 중...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5 mr-2" />
                주변 약국 찾기
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Pharmacy List Sheet */}
      <NearbyPharmacyListSheet
        isOpen={pharmacySheetOpen}
        onClose={() => setPharmacySheetOpen(false)}
        pharmacies={pharmacies}
        isLoading={pharmaciesLoading}
        error={pharmaciesError}
        onSelectPharmacy={(p) => {
          setSelectedPharmacy(p);
          setPharmacySheetOpen(false);
        }}
      />

      {/* Pharmacy Detail Sheet */}
      <PharmacyBottomSheet
        pharmacy={selectedPharmacy}
        isOpen={!!selectedPharmacy}
        onClose={() => setSelectedPharmacy(null)}
      />
    </div>
  );
};

export default MedicineGuidePage;
