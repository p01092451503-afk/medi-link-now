import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";

const BANNER_DISMISSED_KEY = "medi_link_install_banner_dismissed";

const InstallBanner = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Check if banner was dismissed
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissed = dismissedDate
      ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    // Show banner if not installed and not dismissed in the last 3 days
    if (!standalone && daysSinceDismissed > 3) {
      // Small delay for smoother UX
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, new Date().toISOString());
    setIsVisible(false);
  };

  const handleInstall = () => {
    navigate("/install");
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 p-3 bg-gradient-to-r from-primary to-blue-600 shadow-lg"
        >
          <div className="max-w-md mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">
                앱으로 더 빠르게!
              </p>
              <p className="text-white/80 text-xs leading-tight mt-0.5">
                홈 화면에 설치하고 바로 사용하세요
              </p>
            </div>

            <button
              onClick={handleInstall}
              className="shrink-0 px-4 py-2 bg-white rounded-full text-primary text-sm font-semibold hover:bg-white/90 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              설치
            </button>

            <button
              onClick={handleDismiss}
              className="shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallBanner;
