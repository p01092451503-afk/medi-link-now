import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Heart, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "medi_link_has_seen_onboarding";

interface OnboardingModalProps {
  onClose?: () => void;
}

const OnboardingModal = ({ onClose }: OnboardingModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      // Small delay to let the map load first
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsOpen(false);
    onClose?.();
  };

  const handleNext = () => {
    if (step < 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const steps = [
    {
      icon: Search,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
      title: "AI 증상 검색",
      description: "증상을 자연어로 입력하면 AI가 분석하여\n적합한 병원을 자동으로 추천해드립니다.",
      example: "예: \"아이가 열이 나요\", \"가슴이 답답해요\"",
    },
    {
      icon: Heart,
      iconColor: "text-pink-500",
      iconBg: "bg-pink-100",
      title: "가족 의료 카드",
      description: "가족의 건강정보를 미리 저장해두면\n응급상황에서 빠르게 정보를 공유할 수 있어요.",
      example: "혈액형, 알레르기, 기저질환 등을 저장하세요",
    },
  ];

  const currentStep = steps[step];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
                <Sparkles className="w-4 h-4" />
                처음 오셨군요!
              </div>
              
              {/* Step Indicator */}
              <div className="flex gap-2 mt-4">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      index <= step ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className={`w-20 h-20 rounded-2xl ${currentStep.iconBg} flex items-center justify-center mx-auto mb-4`}>
                    <currentStep.icon className={`w-10 h-10 ${currentStep.iconColor}`} />
                  </div>
                  
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {currentStep.title}
                  </h2>
                  
                  <p className="text-muted-foreground text-sm whitespace-pre-line mb-3">
                    {currentStep.description}
                  </p>
                  
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      💡 {currentStep.example}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <Button
                onClick={handleNext}
                className="w-full py-6 rounded-2xl text-base font-semibold"
              >
                {step < steps.length - 1 ? "다음" : "시작하기"}
              </Button>
              
              {step === 0 && (
                <button
                  onClick={handleClose}
                  className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  건너뛰기
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
