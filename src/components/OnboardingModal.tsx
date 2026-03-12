import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import stepWelcome from "@/assets/onboarding/step-welcome.png";
import stepData from "@/assets/onboarding/step-data.png";
import stepMap from "@/assets/onboarding/step-map.png";

const STORAGE_KEY = "finder-has-visited";

interface OnboardingModalProps {
  forceOpen?: boolean;
  onComplete?: () => void;
}

const slides = [
  {
    image: stepWelcome,
    titleKr: "모두를 위한 공익 서비스",
    subtitle: "Public Service for Everyone",
    description:
      "Find-ER은 생명을 살리기 위한 비영리 플랫폼입니다.\n누구나 무료로 전국 응급실 현황을 확인할 수 있습니다.",
    gradient: "from-[hsl(220,100%,96%)] to-[hsl(220,80%,88%)]",
    accentColor: "hsl(220, 100%, 50%)",
  },
  {
    image: stepData,
    titleKr: "검증된 데이터 소스",
    subtitle: "Verified Data Source",
    description:
      "NEDIS(국가응급진료정보망) 및 소방청 119 데이터와\n연동하여 정확한 실시간 응급실 정보를 제공합니다.",
    gradient: "from-[hsl(160,60%,94%)] to-[hsl(160,70%,85%)]",
    accentColor: "hsl(160, 84%, 39%)",
  },
  {
    image: stepMap,
    titleKr: "신호등 시스템으로 한눈에",
    subtitle: "Green = Available · Red = Full",
    description:
      "지도 위 마커 색상으로 병원 가용 병상을\n즉시 확인하세요. 가장 가까운 병원을 빠르게 찾습니다.",
    gradient: "from-[hsl(0,70%,96%)] to-[hsl(0,60%,88%)]",
    accentColor: "hsl(0, 84%, 60%)",
  },
];

const OnboardingModal = ({ forceOpen = false, onComplete }: OnboardingModalProps) => {
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    const hasVisited = localStorage.getItem(STORAGE_KEY);
    if (!hasVisited) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleClose = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
    onComplete?.();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleClose();
    }
  }, [currentSlide, handleClose]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) setCurrentSlide((prev) => prev - 1);
  }, [currentSlide]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? handleNext() : handlePrev();
    }
    setTouchStart(null);
  };

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-full max-w-[380px] bg-card rounded-3xl shadow-2xl overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Illustration area with gradient */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`img-${currentSlide}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`relative h-52 bg-gradient-to-br ${slide.gradient} flex items-center justify-center overflow-hidden`}
              >
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-sm" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/15 blur-sm" />

                <motion.img
                  key={`illustration-${currentSlide}`}
                  src={slide.image}
                  alt={slide.titleKr}
                  className="relative z-[1] w-36 h-36 object-contain drop-shadow-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Text Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${currentSlide}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="px-7 pt-6 pb-4"
              >
                <h2 className="text-center text-xl font-bold text-foreground tracking-tight">
                  {slide.titleKr}
                </h2>
                <p className="text-center text-[11px] font-medium text-muted-foreground mt-1 mb-4">
                  {slide.subtitle}
                </p>
                <p className="text-[14px] text-muted-foreground leading-relaxed text-center whitespace-pre-line">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Controls */}
            <div className="px-7 pb-7 pt-2">
              {/* Dots */}
              <div className="flex items-center justify-center gap-2 mb-5">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: index === currentSlide ? 24 : 8,
                      height: 8,
                      backgroundColor:
                        index === currentSlide
                          ? slide.accentColor
                          : "hsl(var(--muted-foreground) / 0.2)",
                    }}
                    aria-label={`${index + 1}번째 슬라이드`}
                  />
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={handleNext}
                className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-primary-foreground transition-all flex items-center justify-center gap-2 group shadow-lg active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${slide.accentColor}, ${slide.accentColor}dd)`,
                }}
              >
                {isLastSlide ? "시작하기" : "다음"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Skip */}
              {!isLastSlide && (
                <button
                  onClick={handleClose}
                  className="w-full text-center mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
