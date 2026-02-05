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
            className="fixed inset-0 bg-black/50 z-[1100]"
            onClick={onDismiss}
          />

          {/* Coachmark tooltip - positioned to point at the location button */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed z-[1101] w-72 sm:w-80"
            style={tooltipStyle}
          >
            <div 
              className="relative rounded-2xl shadow-2xl p-5 sm:p-6 border"
              style={{ 
                backgroundColor: 'white',
                borderColor: '#e2e8f0'
              }}
            >
              {/* Arrow pointing right */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                <div 
                  className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[12px]"
                  style={{ borderLeftColor: 'white' }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={onDismiss}
                className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95"
                style={{ backgroundColor: '#f1f5f9' }}
              >
                <X className="w-5 h-5" style={{ color: '#64748b' }} />
              </button>

              {/* Content */}
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  }}
                >
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                
                {/* Text content */}
                <div className="flex-1 pt-1">
                  <h3 
                    className="font-bold text-base mb-1"
                    style={{ color: '#0f172a' }}
                  >
                    내 주변 병원 찾기
                  </h3>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: '#475569' }}
                  >
                    탭하면 가까운 응급실을<br />
                    거리순으로 안내합니다
                  </p>
                </div>
              </div>

              {/* Action hint */}
              <div 
                className="mt-4 pt-3 border-t flex items-center justify-center gap-2"
                style={{ borderColor: '#e2e8f0' }}
              >
                <span 
                  className="text-xs font-medium"
                  style={{ color: '#3b82f6' }}
                >
                  탭하여 시작하기
                </span>
                <ChevronRight className="w-4 h-4" style={{ color: '#3b82f6' }} />
              </div>
            </div>
          </motion.div>

          {/* Highlight ring around the button area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-[1101] pointer-events-none rounded-xl animate-pulse"
            style={{
              ...highlightStyle,
              border: '3px solid white',
              boxShadow: '0 0 0 4px rgba(59,130,246,0.5), 0 4px 20px rgba(0,0,0,0.15)'
            }}
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
