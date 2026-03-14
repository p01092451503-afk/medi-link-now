import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, SkipForward, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import StepIntro from "@/components/onboarding/StepIntro";
import StepRole from "@/components/onboarding/StepRole";
import StepTerms from "@/components/onboarding/StepTerms";
import StepLocation from "@/components/onboarding/StepLocation";
import StepNotification from "@/components/onboarding/StepNotification";
import StepFamily from "@/components/onboarding/StepFamily";
import type { UserRole } from "@/components/onboarding/StepRole";

const ONBOARDED_KEY = "find-er-onboarded";
const ROLE_KEY = "find-er-user-role";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 260 : -260, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -260 : 260, opacity: 0 }),
};

const SWIPE_THRESHOLD = 50;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);

  // Family form
  const [familyName, setFamilyName] = useState("");
  const [familyRelation, setFamilyRelation] = useState("");
  const [familyBlood, setFamilyBlood] = useState("");

  const showFamilyStep = role === "guardian" || role === null;

  // Steps: 0=Intro, 1=Role, 2=Terms, 3=Location, 4=Notification, 5=Family(guardian)
  const steps = useMemo(() => {
    const base = ["intro", "role", "terms", "location", "notification"];
    if (showFamilyStep) base.push("family");
    return base;
  }, [showFamilyStep]);

  const totalSteps = steps.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const isLastStep = step === totalSteps - 1;

  const canAdvance = useCallback(() => {
    if (step === 1 && !role) return false;
    if (step === 2 && !termsAgreed) return false;
    return true;
  }, [step, role, termsAgreed]);

  const goNext = useCallback(() => {
    if (!canAdvance()) {
      if (step === 1) toast({ title: "역할을 선택해주세요", variant: "destructive" });
      if (step === 2) toast({ title: "필수 약관에 동의해주세요", variant: "destructive" });
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [canAdvance, step, totalSteps]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  // Swipe handler
  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.x < -SWIPE_THRESHOLD && info.velocity.x < -100) {
        if (step < totalSteps - 1 && canAdvance()) goNext();
      } else if (info.offset.x > SWIPE_THRESHOLD && info.velocity.x > 100) {
        if (step > 0) goPrev();
      }
    },
    [step, totalSteps, canAdvance, goNext, goPrev]
  );

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationGranted(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setLocationGranted(true),
      (err) => {
        // In iframe/preview, permission is blocked by policy (code 1) — treat as success for onboarding
        const isIframe = window.self !== window.top;
        if (isIframe && err.code === 1) {
          setLocationGranted(true);
        } else {
          setLocationGranted(false);
        }
      }
    );
  }, []);

  const requestNotification = useCallback(async () => {
    localStorage.setItem("find-er-notif-requested", "true");
    if (!("Notification" in window)) {
      setNotifGranted(true);
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      // In iframe/preview, permission is always "denied" — treat as success for onboarding
      setNotifGranted(perm === "granted" || perm === "denied");
    } catch {
      setNotifGranted(true);
    }
  }, []);

  // Hybrid sync: save to localStorage + attempt DB sync
  const syncToDatabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Sync role
      if (role) {
        const dbRole = role === "paramedic" ? "guardian" : role;
        await supabase.from("user_roles").upsert(
          { user_id: user.id, role: dbRole as "guardian" | "driver", terms_agreed_at: termsAgreed ? new Date().toISOString() : null },
          { onConflict: "user_id" }
        );
      }

      // Sync family member
      if (familyName.trim() && role === "guardian") {
        await supabase.from("family_members").insert({
          user_id: user.id,
          name: familyName.trim(),
          relation: familyRelation.trim() || "본인",
          blood_type: familyBlood || "unknown",
          age: 0,
        });
      }
    } catch {
      // Silent fail - localStorage is the fallback
    }
  }, [role, termsAgreed, familyName, familyRelation, familyBlood]);

  const handleComplete = useCallback(async () => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    if (role) localStorage.setItem(ROLE_KEY, role);
    if (termsAgreed) localStorage.setItem("find-er-terms-agreed", "true");

    // Save family to localStorage
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

    // Attempt DB sync
    await syncToDatabase();

    const routeMap: Record<UserRole, string> = {
      guardian: "/guardian",
      driver: "/driver-intro",
      paramedic: "/paramedic",
    };
    navigate(role ? routeMap[role] : "/map", { replace: true });
  }, [role, familyName, familyRelation, familyBlood, termsAgreed, navigate, syncToDatabase]);

  const handleSkip = useCallback(() => {
    // Skip current step (permissions/family)
    setDirection(1);
    if (isLastStep) {
      handleComplete();
    } else {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }
  }, [isLastStep, handleComplete, totalSteps]);

  // Steps that can be skipped
  const isSkippable = step === 3 || step === 4 || (isLastStep && showFamilyStep);

  const renderStep = () => {
    const stepName = steps[step];
    switch (stepName) {
      case "intro": return <StepIntro />;
      case "role": return <StepRole selected={role} onSelect={setRole} />;
      case "terms": return <StepTerms allAgreed={termsAgreed} onAgreeAll={setTermsAgreed} />;
      case "location": return <StepLocation granted={locationGranted} onRequest={requestLocation} />;
      case "notification": return <StepNotification granted={notifGranted} onRequest={requestNotification} />;
      case "family": return (
        <StepFamily
          name={familyName} setName={setFamilyName}
          relation={familyRelation} setRelation={setFamilyRelation}
          bloodType={familyBlood} setBloodType={setFamilyBlood}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm px-5 pt-4 pb-2">
        <Progress value={progress} className="h-1" />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-muted-foreground font-medium">
            {step + 1} / {totalSteps}
          </span>
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button onClick={goPrev} className="text-[11px] text-muted-foreground flex items-center gap-0.5 active:opacity-60">
                <ChevronLeft className="w-3.5 h-3.5" /> 이전
              </button>
            )}
            {isSkippable && !isLastStep && (
              <button onClick={handleSkip} className="text-[11px] text-muted-foreground flex items-center gap-0.5 active:opacity-60">
                건너뛰기 <SkipForward className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step indicator dots */}
      <div className="flex justify-center gap-1.5 py-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === step
                ? "w-5 h-1.5 bg-foreground"
                : i < step
                ? "w-1.5 h-1.5 bg-foreground/30"
                : "w-1.5 h-1.5 bg-muted-foreground/15"
            }`}
          />
        ))}
      </div>

      {/* Slide content with swipe */}
      <div className="flex-1 flex items-center justify-center overflow-hidden py-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="w-full max-w-md mx-auto cursor-grab active:cursor-grabbing"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm px-5 pb-6 pt-3 flex gap-2.5">
        {isLastStep && showFamilyStep ? (
          <>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleComplete}
              className="flex-1 flex items-center justify-center gap-1.5 h-[52px] rounded-2xl bg-secondary text-foreground font-semibold text-[15px] transition-colors hover:bg-secondary/80"
            >
              건너뛰기
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleComplete}
              disabled={!familyName.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 h-[52px] rounded-2xl bg-foreground text-background font-semibold text-[15px] transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              <Check className="w-4 h-4" /> 등록 완료
            </motion.button>
          </>
        ) : isLastStep ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleComplete}
            className="w-full flex items-center justify-center gap-1.5 h-[52px] rounded-2xl bg-foreground text-background font-semibold text-[15px] transition-opacity hover:opacity-90"
          >
            시작하기
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goNext}
            disabled={!canAdvance()}
            className="w-full flex items-center justify-center gap-1.5 h-[52px] rounded-2xl bg-foreground text-background font-semibold text-[15px] transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            다음 <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
