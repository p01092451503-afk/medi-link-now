import { useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForgotPasswordModal = ({ open, onOpenChange }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "이메일을 입력해주세요", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: error.message, variant: "destructive" });
        return;
      }
      setIsSent(true);
    } catch {
      toast({ title: "오류가 발생했습니다", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setEmail("");
      setIsSent(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">비밀번호 재설정</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isSent
              ? "재설정 링크가 이메일로 전송되었습니다."
              : "가입 시 사용한 이메일을 입력하세요."}
          </DialogDescription>
        </DialogHeader>

        {isSent ? (
          <div className="text-center py-4">
            <Mail className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{email}</strong>로 비밀번호 재설정 링크를 보냈습니다. 이메일을 확인해주세요.
            </p>
            <Button onClick={handleClose} className="mt-4 w-full rounded-xl">
              확인
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm text-foreground">이메일</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="py-5 rounded-xl bg-card border-border"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full rounded-xl py-5">
              {isLoading ? "전송 중..." : "재설정 링크 보내기"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;
