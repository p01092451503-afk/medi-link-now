import { useState } from "react";
import SplashScreen from "@/components/SplashScreen";
import OnboardingModal from "@/components/OnboardingModal";
import TrustBadge from "@/components/TrustBadge";

const OnboardingPage = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      {!showSplash && (
        <>
          <TrustBadge />
          <OnboardingModal forceOpen />
        </>
      )}
    </div>
  );
};

export default OnboardingPage;
