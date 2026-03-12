import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Plus, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "finder-install-banner-dismissed";
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/**
 * Smart install prompt banner:
 * - Shows after 30s on page or after 2nd visit
 * - Detects iOS vs Android/Desktop
 * - Remembers dismissal for 3 days
 * - Doesn't show if already installed as PWA
 */
const InstallPromptBanner = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION_MS) {
      return;
    }

    // Detect iOS
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    // Listen for install prompt (Android/Desktop Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show after 20 seconds or if visited before
    const visitCount = parseInt(localStorage.getItem("finder-visit-count") || "0") + 1;
    localStorage.setItem("finder-visit-count", String(visitCount));

    const delay = visitCount >= 2 ? 5000 : 20000;
    const timer = setTimeout(() => setVisible(true), delay);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Navigate to install guide page
      navigate("/install");
      setVisible(false);
    }
  }, [deferredPrompt, navigate]);

  if (isInstalled || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-16 sm:bottom-4 left-3 right-3 z-[999] max-w-md mx-auto"
      >
        <div className="relative bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
          {/* Accent gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[hsl(var(--danger))] to-primary" />

          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
            aria-label="닫기"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-3.5 p-4 pr-12">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0 border border-border/50">
              <img src="/pwa-192x192.png" alt="FIND-ER" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm">FIND-ER 앱 설치</p>
              {isIOS ? (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                  <Share className="w-3 h-3 shrink-0" /> 공유
                  <span className="mx-0.5">→</span>
                  <Plus className="w-3 h-3 shrink-0" /> 홈 화면에 추가
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  홈 화면에 추가하여 더 빠르게 응급실을 찾으세요
                </p>
              )}
            </div>

            <button
              onClick={handleInstall}
              className="shrink-0 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-all active:scale-95 flex items-center gap-1.5"
            >
              {deferredPrompt ? (
                <>
                  <Download className="w-3.5 h-3.5" />
                  설치
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  안내
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPromptBanner;
