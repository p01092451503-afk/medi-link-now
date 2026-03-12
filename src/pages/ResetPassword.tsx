import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SubPageHeader from "@/components/SubPageHeader";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery event from URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({ title: "비밀번호는 8자 이상이어야 합니다", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "비밀번호가 일치하지 않습니다", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: error.message, variant: "destructive" });
        return;
      }
      setIsSuccess(true);
      toast({ title: "비밀번호가 변경되었습니다" });
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      toast({ title: "오류가 발생했습니다", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SubPageHeader title="비밀번호 재설정" backTo="/login" />
        <main className="flex-1 flex items-center justify-center px-5">
          <p className="text-muted-foreground text-center">
            이메일의 비밀번호 재설정 링크를 통해 접속해주세요.
          </p>
        </main>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SubPageHeader title="비밀번호 재설정" backTo="/login" />
        <main className="flex-1 flex flex-col items-center justify-center px-5 gap-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <p className="text-foreground font-semibold text-lg">비밀번호가 변경되었습니다</p>
          <p className="text-muted-foreground text-sm">잠시 후 로그인 페이지로 이동합니다...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SubPageHeader title="새 비밀번호 설정" backTo="/login" />
      <main className="flex-1 flex flex-col items-center justify-center px-5 pb-8 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium text-foreground">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="8자 이상 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="py-6 rounded-2xl bg-card border-border text-foreground"
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="비밀번호 다시 입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="py-6 rounded-2xl bg-card border-border text-foreground"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 rounded-2xl text-[15px] font-semibold"
            >
              {isLoading ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default ResetPassword;
