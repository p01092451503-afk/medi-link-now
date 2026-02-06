import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Database, CircleDot, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "finder-has-visited";

const slides = [
  {
    icon: ShieldCheck,
    title: "Public Service for Everyone",
    titleKr: "모두를 위한 공익 서비스",
    description:
      "Find-ER은 생명을 살리기 위한 비영리 플랫폼입니다. 누구나 무료로 전국 응급실 현황을 확인할 수 있습니다.",
    descriptionEn:
      "A non-profit platform dedicated to saving lives. Free access to real-time ER status nationwide.",
    accent: "from-blue-500 to-sky-400",
    bgAccent: "bg-blue-50 dark:bg-blue-950/40",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Database,
    title: "Verified Data Source",
    titleKr: "검증된 데이터 소스",
    description:
      "NEDIS(국가응급진료정보망) 및 소방청 119 데이터와 연동하여 정확한 실시간 응급실 정보를 제공합니다.",
    descriptionEn:
      "Connected with NEDIS & Fire Agency 119 data for accurate real-time emergency info.",
    accent: "from-emerald-500 to-teal-400",
    bgAccent: "bg-emerald-50 dark:bg-emerald-950/40",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: CircleDot,
    title: "How to Use",
    titleKr: "신호등 시스템으로 한눈에",
    description:
      "🟢 초록색 = 입원 가능 | 🔴 빨간색 = 만석. 지도 위 마커 색상으로 병원 가용 병상을 즉시 확인하세요.",
    descriptionEn:
      "🟢 Green = Available | 🔴 Red = Full. Instantly see hospital bed availability on the map.",
    accent: "from-amber-500 to-orange-400",
    bgAccent: "bg-amber-50 dark:bg-amber-950/40",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
];

const OnboardingModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasVisited = localStorage.getItem(STORAGE_KEY);
    if (!hasVisited) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
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
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Skip button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
              aria-label="Skip onboarding"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Slide Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                className="p-8 pt-10"
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl ${slide.iconBg} flex items-center justify-center mb-6 mx-auto`}>
                  <slide.icon className={`w-8 h-8 ${slide.iconColor}`} />
                </div>

                {/* Title */}
                <h2 className="text-center text-lg font-bold text-foreground mb-1">
                  {slide.titleKr}
                </h2>
                <p className="text-center text-xs font-medium text-muted-foreground mb-5">
                  {slide.title}
                </p>

                {/* Description */}
                <div className={`rounded-2xl p-4 ${slide.bgAccent} mb-2`}>
                  <p className="text-sm text-foreground leading-relaxed text-center">
                    {slide.description}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed text-center mt-2">
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
                        ? "w-6 h-2 bg-primary"
                        : "w-2 h-2 bg-muted-foreground/25 hover:bg-muted-foreground/40"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleNext}
                className={`w-full py-6 rounded-2xl text-base font-bold bg-gradient-to-r ${slide.accent} hover:opacity-90 border-0 shadow-lg group transition-all`}
              >
                {isLastSlide ? (
                  <>
                    Start Find-ER
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                ) : (
                  <>
                    다음
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
