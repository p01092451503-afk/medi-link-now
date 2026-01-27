import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, ChevronRight } from "lucide-react";

const STORAGE_KEY = "location-coachmark-seen";

interface LocationCoachmarkProps {
  show: boolean;
  onDismiss: () => void;
}

const LocationCoachmark = ({ show, onDismiss }: LocationCoachmarkProps) => {
  if (!show) return null;

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
            className="fixed right-20 z-[1101] w-64 sm:w-72"
            style={{ top: 'calc(50% + 60px)', transform: 'translateY(-50%)' }}
          >
            <div className="relative bg-white rounded-2xl shadow-2xl p-5 border border-gray-100">
              {/* Arrow pointing right */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[12px] border-l-white drop-shadow-lg" />
              </div>

              {/* Close button */}
              <button
                onClick={onDismiss}
                className="absolute -top-2 -right-2 w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              {/* Content */}
              <div className="space-y-4">
                {/* Icon header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base">내 주변 병원 찾기</p>
                    <p className="text-xs text-muted-foreground">빠른 응급실 안내</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    <span className="font-semibold text-foreground">이 버튼을 탭하면</span> 현재 위치를 기준으로 가장 가까운 응급실을 거리순으로 안내합니다.
                  </p>
                  <p className="text-xs">
                    응급 상황에서 빠르게 가까운 병원을 찾을 수 있어요.
                  </p>
                </div>

                {/* CTA button */}
                <button
                  onClick={onDismiss}
                  className="w-full bg-gradient-to-r from-primary to-primary/90 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
                >
                  알겠습니다
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Highlight ring around the button area - centered vertically with some offset */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed right-4 z-[1101] pointer-events-none"
            style={{ top: 'calc(50% + 60px)', transform: 'translateY(-50%)' }}
          >
            <div className="w-16 h-16 rounded-xl border-[3px] border-white shadow-[0_0_0_4px_rgba(59,130,246,0.5)] animate-pulse" />
          </motion.div>
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
