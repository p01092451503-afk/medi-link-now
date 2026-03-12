import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DISMISSED_KEY = "find-er-medical-disclaimer-v1";

interface MedicalDisclaimerProps {
  variant?: "banner" | "compact";
}

const MedicalDisclaimer = ({ variant = "banner" }: MedicalDisclaimerProps) => {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (!dismissed) setIsDismissed(false);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "true");
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  if (variant === "compact") {
    return (
      <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 text-center">
        <p className="text-[11px] text-muted-foreground">
          <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-500" />
          본 서비스는 의료 행위가 아니며, 응급 상황 시 반드시 <strong className="text-foreground">119에 신고</strong>하세요.
          <button onClick={handleDismiss} className="ml-2 text-primary hover:underline">확인</button>
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-16 sm:bottom-4 left-4 right-4 z-[9999] max-w-lg mx-auto"
        >
          <div className="rounded-2xl bg-card border border-border shadow-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground mb-1">의료 면책 고지</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  FIND-ER은 응급의료 정보 제공 서비스이며, <strong className="text-foreground">의료 행위 또는 의료 자문을 대체하지 않습니다.</strong> 병상 정보는 공공 API 기반 참고용이며, 실시간 정확성을 보장하지 않습니다. 응급 상황 시 반드시 <strong className="text-destructive">119에 신고</strong>하세요.
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  사설 구급차 이용 시 발생하는 모든 의료적 판단과 결과에 대한 책임은 이용자에게 있습니다.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full mt-3 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              확인했습니다
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MedicalDisclaimer;
