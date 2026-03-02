import { useState, useEffect } from "react";
import AmbulanceLoader from "@/components/AmbulanceLoader";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  // If already authenticated, check admin role and redirect
  useEffect(() => {
    if (!isAuthenticated || isAuthLoading || !user) return;

    setIsCheckingRole(true);
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data: isAdmin, error }) => {
        setIsCheckingRole(false);
        if (error) {
          console.error("Role check error:", error);
          return;
        }
        if (isAdmin) {
          navigate("/admin", { replace: true });
        } else {
          // Logged in but not admin — sign out and show error
          supabase.auth.signOut();
          toast({
            title: "접근 권한이 없습니다",
            description: "관리자 계정으로 로그인해주세요.",
            variant: "destructive",
          });
        }
      });
  }, [isAuthenticated, isAuthLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast({ title: "이메일과 비밀번호를 입력해주세요", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          toast({ title: "이메일 또는 비밀번호가 올바르지 않습니다", variant: "destructive" });
        } else {
          toast({ title: signInError.message, variant: "destructive" });
        }
        setIsLoading(false);
        return;
      }

      if (!signInData.user) {
        toast({ title: "로그인 실패", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Check admin role
      const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
        _user_id: signInData.user.id,
        _role: "admin",
      });

      if (roleError || !isAdmin) {
        // Not admin — sign out immediately
        await supabase.auth.signOut();
        toast({
          title: "관리자 권한이 없습니다",
          description: "이 계정은 관리자 권한이 부여되지 않았습니다.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({ title: "관리자 로그인 성공!" });
      navigate("/admin", { replace: true });
    } catch {
      toast({ title: "오류가 발생했습니다", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading || isCheckingRole) {
    return <AmbulanceLoader variant="fullscreen" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Icon & Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
            <Shield className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">관리자 로그인</h1>
          <p className="text-sm text-slate-400">Find-ER 관리 시스템에 접속합니다</p>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-6">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-400">
            이 페이지는 관리자 전용입니다. 관리자 권한이 없는 계정은 로그인이 거부됩니다.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-sm font-medium text-slate-300">
              관리자 이메일
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@find-er.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 py-6 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-sm font-medium text-slate-300">
              비밀번호
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 py-6 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20"
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-6 rounded-xl text-base font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900"
          >
            {isLoading ? (
              <AmbulanceLoader variant="inline" />
            ) : (
              "관리자 로그인"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
