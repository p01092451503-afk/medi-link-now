import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer,
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
import { useNearbyPharmacies, type PharmacyFilterType } from "@/hooks/useNearbyPharmacies";
import NearbyPharmacyListSheet from "@/components/NearbyPharmacyListSheet";
import PharmacyBottomSheet from "@/components/PharmacyBottomSheet";
import SubPageHeader from "@/components/SubPageHeader";

type TabType = "fever" | "stomach";

/* ───────── Dosage helpers ───────── */
const calcAcetaminophen = (kg: number) => {
  const mgDose = kg * 10;
  const mlSyrup = +(kg * 0.4).toFixed(1);
  return { mgDose, mlSyrup };
};
const calcIbuprofen = (kg: number) => {
  const mgDose = kg * 5;
  const mlSyrup = +(kg * 0.25).toFixed(1);
  return { mgDose, mlSyrup };
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

const MedicineGuidePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("fever");
  const [weightInput, setWeightInput] = useState("");
  const [pharmacySheetOpen, setPharmacySheetOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<
    import("@/hooks/useNearbyPharmacies").NearbyPharmacy | null
  >(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [pharmacyFilter, setPharmacyFilter] = useState<PharmacyFilterType>("all");

  const weight = parseFloat(weightInput) || 0;
  const validWeight = weight >= 3 && weight <= 50;

  const { pharmacies, isLoading: pharmaciesLoading, error: pharmaciesError, searchRadiusKm } =
    useNearbyPharmacies({
      enabled: pharmacySheetOpen && !!userLocation,
      userLocation,
      filter: pharmacyFilter,
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

  const tabs: { id: TabType; label: string; emoji: string }[] = [
    { id: "fever", label: "발열", emoji: "🔥" },
    { id: "stomach", label: "복통", emoji: "🤢" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SubPageHeader title="약 가이드" />

      <main className="flex-1 max-w-lg mx-auto w-full px-5 pb-28">
        {/* Title */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="pt-8 pb-6"
        >
          <h2 className="text-[1.75rem] leading-tight font-extrabold text-foreground tracking-tight mb-2">
            소아 응급 약 가이드
          </h2>
          <p className="text-sm text-muted-foreground">
            병원 가기 전, 집에서 먼저 대처하세요
          </p>
        </motion.div>

        {/* Tab Selector */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="flex gap-2 mb-6"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-foreground text-background shadow-lg"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="mr-1.5">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </motion.div>

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
              <FeverTabContent
                weightInput={weightInput}
                setWeightInput={setWeightInput}
                validWeight={validWeight}
                acetaminophen={acetaminophen}
                ibuprofen={ibuprofen}
              />
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
              <StomachTabContent />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <div className="mt-8 p-3 bg-secondary rounded-2xl">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            ※ 이 정보는 일반적인 가이드이며 의료 전문가의 진단을 대체하지 않습니다.
            <br />
            증상이 심하거나 판단이 어려우면 반드시 의사와 상담하세요.
          </p>
        </div>
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border p-4 safe-bottom">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleFindPharmacy}
            disabled={isLocating}
            className="w-full py-6 rounded-2xl text-[15px] font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all border-0"
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
        searchRadiusKm={searchRadiusKm}
        activeFilter={pharmacyFilter}
        onFilterChange={setPharmacyFilter}
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

/* ─── Fever Tab ─── */
interface FeverTabProps {
  weightInput: string;
  setWeightInput: (v: string) => void;
  validWeight: boolean;
  acetaminophen: { mgDose: number; mlSyrup: number };
  ibuprofen: { mgDose: number; mlSyrup: number };
}

const FeverTabContent = ({
  weightInput,
  setWeightInput,
  validWeight,
  acetaminophen,
  ibuprofen,
}: FeverTabProps) => (
  <>
    {/* Medicine Comparison */}
    <div className="grid grid-cols-2 gap-3">
      {/* Acetaminophen */}
      <div className="bg-card rounded-2xl border border-border p-4 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-danger-light flex items-center justify-center mb-3">
          <Thermometer className="w-7 h-7 text-danger" />
        </div>
        <p className="text-[10px] font-bold text-danger mb-0.5 tracking-wide">RED CHAMP</p>
        <h3 className="text-sm font-extrabold text-foreground mb-1">아세트아미노펜</h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed">타이레놀, 챔프시럽</p>
        <div className="mt-3 pt-3 border-t border-border text-left space-y-1.5">
          <BulletItem color="text-danger">4~6시간 간격 투여</BulletItem>
          <BulletItem color="text-danger">생후 4개월부터 사용 가능</BulletItem>
          <BulletItem color="text-danger">하루 최대 5회</BulletItem>
        </div>
      </div>

      {/* Ibuprofen */}
      <div className="bg-card rounded-2xl border border-border p-4 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
          <Droplets className="w-7 h-7 text-primary" />
        </div>
        <p className="text-[10px] font-bold text-primary mb-0.5 tracking-wide">BLUE CHAMP</p>
        <h3 className="text-sm font-extrabold text-foreground mb-1">이부프로펜</h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed">부루펜시럽, 맥시부펜</p>
        <div className="mt-3 pt-3 border-t border-border text-left space-y-1.5">
          <BulletItem color="text-primary">6~8시간 간격 투여</BulletItem>
          <BulletItem color="text-primary">생후 6개월부터 사용 가능</BulletItem>
          <BulletItem color="text-primary">하루 최대 4회</BulletItem>
        </div>
      </div>
    </div>

    {/* Dosage Calculator */}
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
          <Scale className="w-4 h-4 text-accent-foreground" />
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
            className="pr-8 rounded-xl border border-border focus:border-primary text-center text-lg font-bold bg-secondary"
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
            <div className="flex items-center justify-between p-3.5 bg-danger-light rounded-xl border border-danger/20">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-danger" />
                <span className="text-xs font-semibold text-foreground">아세트아미노펜</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-danger">{acetaminophen.mlSyrup}ml</p>
                <p className="text-[10px] text-muted-foreground">({acetaminophen.mgDose}mg)</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">이부프로펜</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-primary">{ibuprofen.mlSyrup}ml</p>
                <p className="text-[10px] text-muted-foreground">({ibuprofen.mgDose}mg)</p>
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
    <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-2xl border border-warning/20">
      <div className="w-8 h-8 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
        <Info className="w-4 h-4 text-warning" />
      </div>
      <div>
        <p className="text-xs font-bold text-foreground mb-1">교차 복용 팁</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          해열제 복용 2시간 후에도 열이 내리지 않으면,{" "}
          <span className="font-bold text-foreground">다른 계열</span>의 해열제로 교차 복용하세요.
          (예: 타이레놀 → 2시간 후 → 부루펜)
        </p>
      </div>
    </div>

    {/* When to go to ER */}
    <div className="flex items-start gap-3 p-4 bg-danger-light rounded-2xl border border-danger/20">
      <div className="w-8 h-8 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-danger" />
      </div>
      <div>
        <p className="text-xs font-bold text-foreground mb-1">병원에 가야 하는 경우</p>
        <ul className="text-[11px] text-muted-foreground leading-relaxed space-y-1">
          <li>• 38.5°C 이상 고열이 24시간 이상 지속</li>
          <li>• 생후 3개월 미만 아기의 38°C 이상 발열</li>
          <li>• 경련, 발진, 심한 보챔 동반 시</li>
        </ul>
      </div>
    </div>
  </>
);

/* ─── Stomach Tab ─── */
const StomachTabContent = () => (
  <>
    {/* OTC Medicines */}
    <div className="space-y-3">
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
            <Pill className="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">백초시럽</h3>
            <p className="text-[11px] text-muted-foreground">소화 불량 · 체했을 때</p>
          </div>
        </div>
        <div className="space-y-1.5 pl-1">
          <BulletItem color="text-success">소화불량, 더부룩함에 효과적</BulletItem>
          <BulletItem color="text-success">연령별 용량을 확인하세요</BulletItem>
          <BulletItem color="text-success">식후 30분에 복용</BulletItem>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <Droplets className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">키즈활명수</h3>
            <p className="text-[11px] text-muted-foreground">과식 · 구역질 · 배탈</p>
          </div>
        </div>
        <div className="space-y-1.5 pl-1">
          <BulletItem color="text-accent-foreground">과식, 배탈, 가벼운 구역질에 사용</BulletItem>
          <BulletItem color="text-accent-foreground">만 3세 이상부터 복용 가능</BulletItem>
          <BulletItem color="text-accent-foreground">1일 3회, 식후 복용</BulletItem>
        </div>
      </div>
    </div>

    {/* ER Warning Banner */}
    <div className="p-4 bg-danger-light rounded-2xl border border-danger/20">
      <div className="flex items-center gap-2 mb-2.5">
        <AlertTriangle className="w-5 h-5 text-danger" />
        <h3 className="text-sm font-extrabold text-danger">즉시 응급실 방문이 필요한 경우</h3>
      </div>
      <ul className="space-y-2">
        {[
          "오른쪽 아랫배가 심하게 아플 때 (맹장염 의심)",
          "대변에 피가 섞여 나올 때",
          "심한 구토와 함께 탈수 증상이 있을 때",
          "배를 만지면 딱딱하고 심하게 울 때",
        ].map((text, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
          >
            <span className="font-black text-danger mt-0.5">⚠️</span>
            {text}
          </li>
        ))}
      </ul>
    </div>

    {/* Hydration Tip */}
    <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-2xl border border-primary/20">
      <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Info className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-bold text-foreground mb-1">수분 보충이 중요해요</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          구토·설사 시 이온음료나 경구수액(ORS)을{" "}
          <span className="font-bold text-foreground">소량씩 자주</span> 먹이세요. 한 번에 많이
          먹이면 다시 토할 수 있어요.
        </p>
      </div>
    </div>
  </>
);

/* ─── Shared Bullet Item ─── */
const BulletItem = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
    <span className={`${color} mt-0.5`}>•</span>
    {children}
  </p>
);

export default MedicineGuidePage;
