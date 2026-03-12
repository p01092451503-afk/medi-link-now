import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users, Ambulance, Shield, HeartPulse,
  ChevronRight, ChevronLeft, UserCheck, Stethoscope,
  SkipForward, Check, Locate, Navigation, MapPin,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import stepWelcome from "@/assets/onboarding/step-welcome.png";
import stepRole from "@/assets/onboarding/step-role.png";
import stepLocation from "@/assets/onboarding/step-location.png";
import stepFamily from "@/assets/onboarding/step-family.png";

const ONBOARDED_KEY = "find-er-onboarded";
const ROLE_KEY = "find-er-user-role";
const TOTAL_STEPS_WITH_FAMILY = 4;
const TOTAL_STEPS_WITHOUT_FAMILY = 3;

type UserRole = "guardian" | "driver" | "paramedic";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const stepGradients = [
  "from-[hsl(220,100%,96%)] via-[hsl(220,90%,92%)] to-[hsl(220,80%,88%)]",
  "from-[hsl(0,70%,96%)] via-[hsl(350,60%,92%)] to-[hsl(340,50%,88%)]",
  "from-[hsl(200,80%,95%)] via-[hsl(200,70%,90%)] to-[hsl(200,60%,85%)]",
  "from-[hsl(160,60%,94%)] via-[hsl(160,50%,90%)] to-[hsl(160,40%,85%)]",
];

/* ────────────────── Step 1: 서비스 소개 ────────────────── */
const StepIntro = () => (
  <div className="flex flex-col items-center text-center px-6">
    <div className={`w-full max-w-xs aspect-square rounded-3xl bg-gradient-to-br ${stepGradients[0]} flex items-center justify-center mb-8 relative overflow-hidden`}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/30 blur-md" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/20 blur-md" />
      <motion.img
        src={stepWelcome}
        alt="FIND-ER 서비스"
        className="relative z-[1] w-40 h-40 object-contain drop-shadow-xl"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
      />
    </div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <span className="text-3xl font-extrabold text-foreground tracking-tight">파인더</span>
      <h1 className="text-xl font-bold text-foreground mt-3">
        Find-ER에 오신 것을 환영합니다
      </h1>
      <p className="text-muted-foreground leading-relaxed max-w-sm mt-3 text-sm">
        전국 응급실의 <span className="font-semibold text-primary">실시간 병상 현황</span>을
        확인하고, 가장 가까운 병원을 빠르게 찾을 수 있습니다.
      </p>
    </motion.div>

    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mt-6">
      {[
        { icon: HeartPulse, label: "실시간 현황", color: "text-[hsl(var(--danger))]" },
        { icon: MapPin, label: "주변 병원", color: "text-primary" },
        { icon: Shield, label: "안전한 이송", color: "text-[hsl(var(--success))]" },
      ].map(({ icon: Icon, label, color }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 shadow-sm"
        >
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

/* ────────────────── Step 2: 역할 선택 ────────────────── */
const roles: { id: UserRole; label: string; desc: string; icon: typeof Users; gradient: string }[] = [
  { id: "guardian", label: "보호자 / 환자", desc: "응급실 검색 및 가족 관리", icon: Users, gradient: "from-primary/20 to-primary/5" },
  { id: "driver", label: "사설 구급 기사", desc: "이송 요청 관리 및 운행 기록", icon: Ambulance, gradient: "from-[hsl(var(--danger))]/20 to-[hsl(var(--danger))]/5" },
  { id: "paramedic", label: "119 의료진", desc: "병상 현황 및 이송 최적화", icon: Stethoscope, gradient: "from-[hsl(var(--success))]/20 to-[hsl(var(--success))]/5" },
];

const StepRole = ({ selected, onSelect }: { selected: UserRole | null; onSelect: (r: UserRole) => void }) => (
  <div className="flex flex-col items-center text-center gap-5 px-6">
    <div className={`w-full max-w-[200px] aspect-square rounded-3xl bg-gradient-to-br ${stepGradients[1]} flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/30 blur-md" />
      <motion.img
        src={stepRole}
        alt="역할 선택"
        className="relative z-[1] w-32 h-32 object-contain drop-shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      />
    </div>

    <div>
      <h2 className="text-xl font-bold text-foreground">내 역할을 선택해주세요</h2>
      <p className="text-sm text-muted-foreground mt-1">역할에 맞는 최적의 화면을 제공합니다</p>
    </div>

    <div className="flex flex-col gap-3 w-full max-w-sm">
      {roles.map(({ id, label, desc, icon: Icon }, index) => (
        <motion.button
          key={id}
          onClick={() => onSelect(id)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
            selected === id
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
              : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            selected === id
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground"
          }`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
          {selected === id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0"
            >
              <Check className="w-3.5 h-3.5 text-primary-foreground" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  </div>
);

/* ────────────────── Step 3: 위치 권한 ────────────────── */
const StepLocation = ({ granted, onRequest }: { granted: boolean | null; onRequest: () => void }) => (
  <div className="flex flex-col items-center text-center gap-5 px-6">
    <div className={`w-full max-w-[200px] aspect-square rounded-3xl bg-gradient-to-br ${stepGradients[2]} flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/25 blur-md" />
      <motion.img
        src={stepLocation}
        alt="위치 권한"
        className="relative z-[1] w-32 h-32 object-contain drop-shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      />
    </div>

    <div>
      <h2 className="text-xl font-bold text-foreground">위치 권한이 필요합니다</h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mt-2">
        내 주변 응급실과 약국을 찾기 위해 위치 정보가 필요합니다.
        위치 정보는 <span className="font-semibold text-foreground">검색 목적으로만</span> 사용되며
        서버에 저장되지 않습니다.
      </p>
    </div>

    {granted === null && (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Button onClick={onRequest} size="lg" className="gap-2 rounded-xl shadow-lg shadow-primary/20">
          <Navigation className="w-4 h-4" />
          위치 권한 허용하기
        </Button>
      </motion.div>
    )}
    {granted === true && (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] font-medium"
      >
        <Check className="w-5 h-5" /> 위치 권한이 허용되었습니다
      </motion.div>
    )}
    {granted === false && (
      <div className="text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-xl">
        위치 권한이 거부되었습니다. 설정에서 수동으로 허용해주세요.
      </div>
    )}
  </div>
);

/* ────────────────── Step 4: 가족 등록 ────────────────── */
const StepFamily = ({
  name, setName, relation, setRelation, bloodType, setBloodType,
}: {
  name: string; setName: (v: string) => void;
  relation: string; setRelation: (v: string) => void;
  bloodType: string; setBloodType: (v: string) => void;
}) => (
  <div className="flex flex-col items-center text-center gap-5 px-6">
    <div className={`w-full max-w-[200px] aspect-square rounded-3xl bg-gradient-to-br ${stepGradients[3]} flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/25 blur-md" />
      <motion.img
        src={stepFamily}
        alt="가족 등록"
        className="relative z-[1] w-32 h-32 object-contain drop-shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      />
    </div>

    <div>
      <h2 className="text-xl font-bold text-foreground">가족 구성원 등록</h2>
      <p className="text-sm text-muted-foreground mt-1">
        응급 상황 시 빠른 대응을 위해 가족 정보를 등록해주세요.
      </p>
      <p className="text-[11px] text-muted-foreground/70 mt-0.5">(건너뛰기 가능 — 나중에 추가할 수 있습니다)</p>
    </div>

    <div className="w-full max-w-sm flex flex-col gap-3 text-left">
      <div>
        <Label htmlFor="ob-name" className="text-xs text-muted-foreground mb-1">이름</Label>
        <Input id="ob-name" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
      </div>
      <div>
        <Label htmlFor="ob-rel" className="text-xs text-muted-foreground mb-1">관계</Label>
        <Input id="ob-rel" placeholder="본인, 배우자, 자녀 등" value={relation} onChange={(e) => setRelation(e.target.value)} className="rounded-xl" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1">혈액형</Label>
        <div className="flex gap-2 flex-wrap">
          {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bt) => (
            <button
              key={bt}
              onClick={() => setBloodType(bt)}
              className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all font-medium ${
                bloodType === bt
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {bt}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ════════════════ Main OnboardingPage ════════════════ */
const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Family form state
  const [familyName, setFamilyName] = useState("");
  const [familyRelation, setFamilyRelation] = useState("");
  const [familyBlood, setFamilyBlood] = useState("");

  const showFamilyStep = role === "guardian" || role === null;
  const totalSteps = showFamilyStep ? TOTAL_STEPS_WITH_FAMILY : TOTAL_STEPS_WITHOUT_FAMILY;
  const progress = ((step + 1) / totalSteps) * 100;

  const goNext = useCallback(() => {
    if (step === 1 && !role) {
      toast({ title: "역할을 선택해주세요", variant: "destructive" });
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [step, role, totalSteps]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      diff > 0 ? goNext() : goPrev();
    }
    setTouchStart(null);
  };

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationGranted(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setLocationGranted(true),
      () => setLocationGranted(false),
    );
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    if (role) localStorage.setItem(ROLE_KEY, role);

    // Save family member to localStorage if provided
    if (familyName.trim()) {
      const member = {
        id: crypto.randomUUID(),
        name: familyName.trim(),
        relation: familyRelation.trim() || "본인",
        bloodType: familyBlood || "모름",
        age: 0,
      };
      const existing = JSON.parse(localStorage.getItem("familyMembers") || "[]");
      localStorage.setItem("familyMembers", JSON.stringify([...existing, member]));
    }

    const routeMap: Record<UserRole, string> = {
      guardian: "/guardian",
      driver: "/driver-intro",
      paramedic: "/paramedic",
    };
    navigate(role ? routeMap[role] : "/map", { replace: true });
  }, [role, familyName, familyRelation, familyBlood, navigate]);

  const isLastStep = step === totalSteps - 1;

  const stepColors = ["hsl(220,100%,50%)", "hsl(0,84%,60%)", "hsl(200,80%,45%)", "hsl(160,84%,39%)"];

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md px-5 pt-4 pb-2 border-b border-border/30">
        <Progress value={progress} className="h-1" />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[11px] text-muted-foreground font-medium">
            {step + 1} / {totalSteps}
          </span>
          {step > 0 && (
            <button
              onClick={goPrev}
              className="text-[11px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-3 h-3" /> 이전
            </button>
          )}
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden py-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-md mx-auto"
          >
            {step === 0 && <StepIntro />}
            {step === 1 && <StepRole selected={role} onSelect={setRole} />}
            {step === 2 && <StepLocation granted={locationGranted} onRequest={requestLocation} />}
            {step === 3 && showFamilyStep && (
              <StepFamily
                name={familyName} setName={setFamilyName}
                relation={familyRelation} setRelation={setFamilyRelation}
                bloodType={familyBlood} setBloodType={setFamilyBlood}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom buttons */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur-md px-5 pb-6 pt-3 border-t border-border/30">
        {isLastStep && showFamilyStep ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-1 rounded-xl h-12"
              onClick={handleComplete}
            >
              <SkipForward className="w-4 h-4" /> 건너뛰기
            </Button>
            <Button
              className="flex-1 gap-1 rounded-xl h-12 shadow-lg shadow-primary/20"
              onClick={handleComplete}
              disabled={!familyName.trim()}
            >
              <Check className="w-4 h-4" /> 등록 완료
            </Button>
          </div>
        ) : isLastStep ? (
          <Button
            className="w-full gap-1 rounded-xl h-12 shadow-lg shadow-primary/20"
            onClick={handleComplete}
            size="lg"
          >
            <Check className="w-4 h-4" /> 시작하기
          </Button>
        ) : (
          <Button
            className="w-full gap-1 rounded-xl h-12 shadow-lg shadow-primary/20"
            onClick={goNext}
            size="lg"
            style={{
              background: `linear-gradient(135deg, ${stepColors[step]}, ${stepColors[step]}cc)`,
            }}
          >
            다음 <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
