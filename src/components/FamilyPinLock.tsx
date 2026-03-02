import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

const PIN_STORAGE_KEY = "family_medical_pin";
const PIN_ENABLED_KEY = "family_medical_pin_enabled";

interface FamilyPinLockProps {
  children: React.ReactNode;
}

export const usePinLock = () => {
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);

  useEffect(() => {
    const enabled = localStorage.getItem(PIN_ENABLED_KEY) === "true";
    const pin = localStorage.getItem(PIN_STORAGE_KEY);
    setIsPinEnabled(enabled);
    setStoredPin(pin);
  }, []);

  const enablePin = (pin: string) => {
    localStorage.setItem(PIN_STORAGE_KEY, pin);
    localStorage.setItem(PIN_ENABLED_KEY, "true");
    setIsPinEnabled(true);
    setStoredPin(pin);
  };

  const disablePin = () => {
    localStorage.removeItem(PIN_STORAGE_KEY);
    localStorage.setItem(PIN_ENABLED_KEY, "false");
    setIsPinEnabled(false);
    setStoredPin(null);
  };

  const verifyPin = (pin: string) => {
    return pin === storedPin;
  };

  return { isPinEnabled, storedPin, enablePin, disablePin, verifyPin };
};

// PIN Entry Screen
export const PinEntryScreen = ({ 
  onSuccess, 
  onCancel 
}: { 
  onSuccess: () => void; 
  onCancel?: () => void;
}) => {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(false);
  const { verifyPin } = usePinLock();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPin(pin)) {
      onSuccess();
    } else {
      setError(true);
      setPin("");
      toast({
        title: "비밀번호가 틀렸습니다",
        variant: "destructive",
      });
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-sm bg-card rounded-3xl shadow-2xl p-8 ${error ? "animate-shake" : ""}`}
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            비밀번호 입력
          </h2>
          <p className="text-sm text-muted-foreground">
            가족 의료 정보를 보호합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Input
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="비밀번호 입력"
              maxLength={6}
              className="text-center text-2xl py-6 tracking-widest rounded-xl"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-secondary rounded-full"
            >
              {showPin ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>

          <Button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-6 rounded-xl text-lg font-semibold"
          >
            <Lock className="w-5 h-5 mr-2" />
            잠금 해제
          </Button>
        </form>

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            취소
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

// PIN Settings Modal
export const PinSettingsModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { isPinEnabled, enablePin, disablePin } = usePinLock();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setIsSettingPin(true);
    } else {
      disablePin();
      toast({
        title: "비밀번호 잠금 해제됨",
        description: "이제 비밀번호 없이 접근할 수 있습니다",
      });
    }
  };

  const handleSetPin = () => {
    if (newPin.length < 4) {
      toast({
        title: "비밀번호는 4자리 이상이어야 합니다",
        variant: "destructive",
      });
      return;
    }
    if (newPin !== confirmPin) {
      toast({
        title: "비밀번호가 일치하지 않습니다",
        variant: "destructive",
      });
      return;
    }
    enablePin(newPin);
    setIsSettingPin(false);
    setNewPin("");
    setConfirmPin("");
    toast({
      title: "✅ 비밀번호가 설정되었습니다",
      description: "다음 접속부터 비밀번호를 입력해야 합니다",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[2000]"
          />

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-2xl z-[2001] max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">보안 설정</h3>
                  <p className="text-xs text-muted-foreground">가족 정보 보호</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {!isSettingPin ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">비밀번호 잠금</p>
                      <p className="text-sm text-muted-foreground">
                        앱 실행 시 비밀번호 입력 필요
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isPinEnabled}
                    onCheckedChange={handleToggle}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      새 비밀번호 (4-6자리)
                    </label>
                    <div className="relative">
                      <Input
                        type={showPin ? "text" : "password"}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.slice(0, 6))}
                        placeholder="••••••"
                        maxLength={6}
                        className="text-center text-xl py-5 tracking-widest rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      비밀번호 확인
                    </label>
                    <Input
                      type={showPin ? "text" : "password"}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.slice(0, 6))}
                      placeholder="••••••"
                      maxLength={6}
                      className="text-center text-xl py-5 tracking-widest rounded-xl"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showPin"
                      checked={showPin}
                      onChange={(e) => setShowPin(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="showPin" className="text-sm text-muted-foreground">
                      비밀번호 표시
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setIsSettingPin(false);
                        setNewPin("");
                        setConfirmPin("");
                      }}
                      variant="outline"
                      className="flex-1 py-5 rounded-xl"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleSetPin}
                      className="flex-1 py-5 rounded-xl"
                    >
                      설정 완료
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  💡 비밀번호를 설정하면 가족 의료 정보 페이지에 접근할 때마다 비밀번호를 입력해야 합니다.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
