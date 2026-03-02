import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Hospital, MapPin, Users, Ambulance, Shield, HeartPulse,
  ChevronRight, ChevronLeft, Navigation, UserCheck, Stethoscope,
  SkipForward, Check, Locate,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

/* ────────────────── Step 1: 서비스 소개 ────────────────── */
const StepIntro = () => (
  <div className="flex flex-col items-center text-center px-4">
    <span className="text-3xl font-extrabold text-foreground tracking-tight mb-10">파인더</span>
    <h1 className="text-2xl font-bold text-foreground">
      Find-ER에 오신 것을 환영합니다
    </h1>
    <p className="text-muted-foreground leading-relaxed max-w-sm mt-4">
      전국 응급실의 <span className="font-semibold text-primary">실시간 병상 현황</span>을
      확인하고, 가장 가까운 병원을 빠르게 찾을 수 있습니다.
    </p>
    <div className="grid grid-cols-3 gap-4 w-full max-w-xs mt-2">
      {[
        { icon: HeartPulse, label: "실시간 현황" },
        { icon: MapPin, label: "주변 병원" },
        { icon: Shield, label: "안전한 이송" },
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50">
          <Icon className="w-6 h-6 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ────────────────── Step 2: 역할 선택 ────────────────── */
const roles: { id: UserRole; label: string; desc: string; icon: typeof Users }[] = [
  { id: "guardian", label: "보호자 / 환자", desc: "응급실 검색 및 가족 관리", icon: Users },
  { id: "driver", label: "사설 구급 기사", desc: "이송 요청 관리 및 운행 기록", icon: Ambulance },
  { id: "paramedic", label: "119 의료진", desc: "병상 현황 및 이송 최적화", icon: Stethoscope },
];

const StepRole = ({ selected, onSelect }: { selected: UserRole | null; onSelect: (r: UserRole) => void }) => (
  <div className="flex flex-col items-center text-center gap-6 px-4">
    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
      <UserCheck className="w-10 h-10 text-primary" />
    </div>
    <h2 className="text-xl font-bold text-foreground">내 역할을 선택해주세요</h2>
    <p className="text-sm text-muted-foreground">역할에 맞는 최적의 화면을 제공합니다</p>
    <div className="flex flex-col gap-3 w-full max-w-sm">
      {roles.map(({ id, label, desc, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
            selected === id
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            selected === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
          {selected === id && <Check className="w-5 h-5 text-primary ml-auto shrink-0" />}
        </button>
      ))}
    </div>
  </div>
);

/* ────────────────── Step 3: 위치 권한 ────────────────── */
const StepLocation = ({ granted, onRequest }: { granted: boolean | null; onRequest: () => void }) => (
  <div className="flex flex-col items-center text-center gap-6 px-4">
    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
      granted ? "bg-success/10" : "bg-primary/10"
    }`}>
      {granted ? (
        <Check className="w-10 h-10 text-success" />
      ) : (
        <Locate className="w-10 h-10 text-primary" />
      )}
    </div>
    <h2 className="text-xl font-bold text-foreground">위치 권한이 필요합니다</h2>
    <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
      내 주변 응급실과 약국을 찾기 위해 위치 정보가 필요합니다.
      위치 정보는 <span className="font-semibold text-foreground">검색 목적으로만</span> 사용되며
      서버에 저장되지 않습니다.
    </p>
    {granted === null && (
      <Button onClick={onRequest} size="lg" className="gap-2 mt-2">
        <Navigation className="w-4 h-4" />
        위치 권한 허용하기
      </Button>
    )}
    {granted === true && (
      <div className="flex items-center gap-2 text-success font-medium">
        <Check className="w-5 h-5" /> 위치 권한이 허용되었습니다
      </div>
    )}
    {granted === false && (
      <div className="text-sm text-destructive">
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
  <div className="flex flex-col items-center text-center gap-5 px-4">
    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
      <Users className="w-10 h-10 text-primary" />
    </div>
    <h2 className="text-xl font-bold text-foreground">가족 구성원 등록</h2>
    <p className="text-sm text-muted-foreground">
      응급 상황 시 빠른 대응을 위해 가족 정보를 등록해주세요.
      <br />
      <span className="text-xs">(건너뛰기 가능 — 나중에 추가할 수 있습니다)</span>
    </p>
    <div className="w-full max-w-sm flex flex-col gap-3 text-left">
      <div>
        <Label htmlFor="ob-name" className="text-xs text-muted-foreground">이름</Label>
        <Input id="ob-name" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="ob-rel" className="text-xs text-muted-foreground">관계</Label>
        <Input id="ob-rel" placeholder="본인, 배우자, 자녀 등" value={relation} onChange={(e) => setRelation(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="ob-blood" className="text-xs text-muted-foreground">혈액형</Label>
        <div className="flex gap-2 flex-wrap">
          {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bt) => (
            <button
              key={bt}
              onClick={() => setBloodType(bt)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                bloodType === bt
                  ? "bg-primary text-primary-foreground border-primary"
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

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm px-4 pt-4 pb-2">
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">{step + 1} / {totalSteps}</span>
          {step > 0 && (
            <button onClick={goPrev} className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <ChevronLeft className="w-3 h-3" /> 이전
            </button>
          )}
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden py-8">
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
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm px-4 pb-6 pt-3 flex gap-3">
        {isLastStep && showFamilyStep ? (
          <>
            <Button variant="outline" className="flex-1 gap-1" onClick={handleComplete}>
              <SkipForward className="w-4 h-4" /> 건너뛰기
            </Button>
            <Button className="flex-1 gap-1" onClick={handleComplete} disabled={!familyName.trim()}>
              <Check className="w-4 h-4" /> 등록 완료
            </Button>
          </>
        ) : isLastStep ? (
          <Button className="w-full gap-1" onClick={handleComplete} size="lg">
            <Check className="w-4 h-4" /> 시작하기
          </Button>
        ) : (
          <Button className="w-full gap-1" onClick={goNext} size="lg">
            다음 <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
