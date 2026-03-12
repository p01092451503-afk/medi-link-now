import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Ambulance, Mail, Lock, Users } from "lucide-react";
import AmbulanceLoader from "@/components/AmbulanceLoader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import SubPageHeader from "@/components/SubPageHeader";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "driver";
  const returnTo = searchParams.get("returnTo") || (mode === "guardian" ? "/family" : "/driver");
  
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      navigate(returnTo);
    }
  }, [isAuthenticated, isAuthLoading, navigate, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ title: "이메일과 비밀번호를 입력해주세요", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({ title: error.message.includes("Invalid login credentials") ? "이메일 또는 비밀번호가 올바르지 않습니다" : error.message, variant: "destructive" });
          return;
        }
        toast({ title: "로그인 성공!" });
        navigate(returnTo);
      } else {
        if (!agreedTerms) {
          toast({ title: "이용약관 및 개인정보처리방침에 동의해주세요", variant: "destructive" });
          return;
        }
        const redirectUrl = `${window.location.origin}${returnTo}`;
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } });
        if (error) {
          toast({ title: error.message.includes("already registered") ? "이미 가입된 이메일입니다" : error.message, variant: "destructive" });
          return;
        }
        toast({ title: "회원가입 성공!", description: "이메일 인증 후 로그인해주세요" });
        setIsLogin(true);
      }
    } catch {
      toast({ title: "오류가 발생했습니다", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SubPageHeader title={mode === "guardian" ? "로그인" : "구급대원 로그인"} backTo="/" />

      <main className="flex-1 flex flex-col items-center justify-center px-5 pb-8 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              {mode === "guardian" ? (
                <Users className="w-8 h-8 text-primary" />
              ) : (
                <Ambulance className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-extrabold text-foreground mb-1">
              {isLogin ? "다시 오신 것을 환영합니다" : "새 계정 만들기"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "로그인하여 서비스를 이용하세요" : "가입하여 파인더 서비스를 시작하세요"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="driver@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 py-6 rounded-2xl bg-card border-border text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 py-6 rounded-2xl bg-card border-border text-foreground"
                />
              </div>
            </div>

            {/* Terms checkbox - signup only */}
            {!isLogin && (
              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="terms-agree"
                  checked={agreedTerms}
                  onCheckedChange={(v) => setAgreedTerms(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms-agree" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  <a href="/terms" target="_blank" className="text-primary hover:underline">이용약관</a> 및{" "}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">개인정보처리방침</a>에 동의합니다 (필수)
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (!isLogin ? false : false)}
              className="w-full py-4 rounded-2xl bg-foreground text-background text-[15px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <AmbulanceLoader variant="inline" />
              ) : isLogin ? "로그인" : "회원가입"}
            </button>
          </form>

          {/* Forgot password & toggle */}
          <div className="mt-6 flex flex-col items-center gap-2">
            {isLogin && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                비밀번호를 잊으셨나요?
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
            </button>
          </div>
        </motion.div>

        <ForgotPasswordModal open={showForgotPassword} onOpenChange={setShowForgotPassword} />
      </main>
    </div>
  );
};

export default Login;
