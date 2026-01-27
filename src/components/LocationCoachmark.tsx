import { useState, useEffect, RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, ChevronRight } from "lucide-react";

const STORAGE_KEY = "location-coachmark-seen";

interface LocationCoachmarkProps {
  show: boolean;
  onDismiss: () => void;
  targetRef?: RefObject<HTMLElement>;
}

const LocationCoachmark = ({ show, onDismiss, targetRef }: LocationCoachmarkProps) => {
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  // Get button position dynamically
  useEffect(() => {
    if (show && targetRef?.current) {
      const updatePosition = () => {
        const rect = targetRef.current?.getBoundingClientRect();
        if (rect) setButtonRect(rect);
      };
      
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);
      
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }
  }, [show, targetRef]);

  if (!show) return null;

  // Calculate positions based on button rect
  const highlightStyle = buttonRect ? {
    top: buttonRect.top - 8,
    right: window.innerWidth - buttonRect.right - 8,
    width: buttonRect.width + 16,
    height: buttonRect.height + 16,
  } : {
    top: 'calc(50% + 60px)',
    right: 16,
    width: 64,
    height: 64,
    transform: 'translateY(-50%)',
  };

  const tooltipStyle = buttonRect ? {
    top: buttonRect.top + buttonRect.height / 2,
    right: window.innerWidth - buttonRect.left + 16,
    transform: 'translateY(-50%)',
  } : {
    top: 'calc(50% + 60px)',
    right: 80,
    transform: 'translateY(-50%)',
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[1100]"
            onClick={onDismiss}
          />

          {/* Coachmark tooltip - positioned to point at the location button */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed z-[1101] w-64 sm:w-72"
            style={tooltipStyle}
          >
            <div className="relative bg-white rounded-2xl shadow-2xl p-4 sm:p-5 border border-gray-100">
              {/* Arrow pointing right */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[12px] border-l-white drop-shadow-lg" />
              </div>

              {/* Close button - larger for mobile touch */}
              <button
                onClick={onDismiss}
                className="absolute -top-3 -right-3 w-11 h-11 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors shadow-md active:scale-95"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              {/* Content */}
              <div className="space-y-3 sm:space-y-4">
                {/* Icon header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm sm:text-base">내 주변 병원 찾기</p>
                    <p className="text-xs text-muted-foreground">빠른 응급실 안내</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <p>
                    <span className="font-semibold text-foreground">이 버튼을 탭하면</span> 현재 위치를 기준으로 가장 가까운 응급실을 거리순으로 안내합니다.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Highlight ring around the button area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-[1101] pointer-events-none rounded-xl border-[3px] border-white shadow-[0_0_0_4px_rgba(59,130,246,0.5)] animate-pulse"
            style={highlightStyle}
          />
        </>
      )}
    </AnimatePresence>
  );
};

// Hook to manage coachmark state
export const useLocationCoachmark = () => {
  const [showCoachmark, setShowCoachmark] = useState(false);

  useEffect(() => {
    // Check if user has seen the coachmark
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      // Show after a short delay to let the page load
      const timer = setTimeout(() => {
        setShowCoachmark(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissCoachmark = () => {
    setShowCoachmark(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  return { showCoachmark, dismissCoachmark };
};

export default LocationCoachmark;
