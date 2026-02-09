import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Database, CircleDot, ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "finder-has-visited";

interface OnboardingModalProps {
  forceOpen?: boolean;
  onComplete?: () => void;
}

const slides = [
  {
    icon: ShieldCheck,
    titleKr: "모두를 위한 공익 서비스",
    subtitle: "Public Service for Everyone",
    description:
      "Find-ER은 생명을 살리기 위한 비영리 플랫폼입니다.\n누구나 무료로 전국 응급실 현황을 확인할 수 있습니다.",
    descriptionEn:
      "A non-profit platform dedicated to saving lives. Free access to real-time ER status nationwide.",
  },
  {
    icon: Database,
    titleKr: "검증된 데이터 소스",
    subtitle: "Verified Data Source",
    description:
      "NEDIS(국가응급진료정보망) 및 소방청 119 데이터와 연동하여 정확한 실시간 응급실 정보를 제공합니다.",
    descriptionEn:
      "Connected with NEDIS & Fire Agency 119 data for accurate real-time emergency info.",
  },
  {
    icon: CircleDot,
    titleKr: "신호등 시스템으로 한눈에",
    subtitle: "How to Use",
    description:
      "초록색 = 입원 가능 | 빨간색 = 만석.\n지도 위 마커 색상으로 병원 가용 병상을 즉시 확인하세요.",
    descriptionEn:
      "Green = Available | Red = Full. Instantly see hospital bed availability on the map.",
  },
];

const OnboardingModal = ({ forceOpen = false, onComplete }: OnboardingModalProps) => {
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
    onComplete?.();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleClose();
    }
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-full max-w-sm bg-background rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Slide Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="px-8 pt-12 pb-6"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 mx-auto">
                  <slide.icon className="w-7 h-7 text-foreground" />
                </div>

                {/* Title */}
                <h2 className="text-center text-xl font-bold text-foreground mb-1 tracking-tight">
                  {slide.titleKr}
                </h2>
                <p className="text-center text-[11px] font-medium text-muted-foreground mb-6">
                  {slide.subtitle}
                </p>

                {/* Description Card */}
                <div className="rounded-2xl p-5 bg-secondary">
                  <p className="text-[14px] text-foreground leading-relaxed text-center whitespace-pre-line">
                    {slide.description}
                  </p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed text-center mt-3">
                    {slide.descriptionEn}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Controls */}
            <div className="px-8 pb-8">
              {/* Dots */}
              <div className="flex items-center justify-center gap-2 mb-5">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? "w-6 h-2 bg-foreground"
                        : "w-2 h-2 bg-muted-foreground/25 hover:bg-muted-foreground/40"
                    }`}
                    aria-label={`${index + 1}번째 슬라이드`}
                  />
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-2xl text-[15px] font-bold bg-foreground text-background hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
              >
                {isLastSlide ? "시작하기" : "다음"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
