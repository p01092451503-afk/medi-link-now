import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Share, Plus, Smartphone, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">앱 설치</h1>
        </motion.div>

        {/* App Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
            <img
              src="/pwa-192x192.png"
              alt="FIND-ER"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">FIND-ER</h2>
          <p className="text-muted-foreground">전국 응급실 실시간 현황</p>
        </motion.div>

        {/* Install Status */}
        {isInstalled ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                  이미 설치되었습니다!
                </h3>
                <p className="text-green-600 dark:text-green-500 text-sm">
                  홈 화면에서 Medi-Link 앱을 찾아보세요.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : isIOS ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  iOS에서 설치하기
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Safari 공유 버튼 탭</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      화면 하단의 <Share className="w-4 h-4" /> 아이콘을 탭하세요
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-foreground">"홈 화면에 추가" 선택</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Plus className="w-4 h-4" /> 홈 화면에 추가를 찾아 탭하세요
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-foreground">"추가" 탭</p>
                    <p className="text-sm text-muted-foreground">
                      오른쪽 상단의 "추가" 버튼을 탭하면 완료!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : deferredPrompt ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Button
              onClick={handleInstallClick}
              className="w-full h-14 text-lg"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              앱 설치하기
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              홈 화면에 추가하여 빠르게 접근하세요
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  브라우저에서 설치하기
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택하세요.
                </p>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>Chrome:</strong> 주소창 오른쪽의 설치 아이콘 클릭
                  </p>
                  <p className="text-sm text-foreground mt-2">
                    <strong>Samsung Internet:</strong> 메뉴 → 페이지 추가 → 홈 화면
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">앱 설치 장점</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🚀", title: "빠른 실행", desc: "홈 화면에서 바로" },
              { icon: "📴", title: "오프라인 지원", desc: "인터넷 없이도 사용" },
              { icon: "📱", title: "전체 화면", desc: "앱처럼 사용" },
              { icon: "🔔", title: "알림 지원", desc: "중요 정보 즉시 확인" },
            ].map((feature, index) => (
              <Card key={index} className="bg-card/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <p className="font-medium text-foreground text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Back to App */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <Button variant="ghost" onClick={() => navigate("/")}>
            앱으로 돌아가기
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default InstallPage;
