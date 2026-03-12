import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AccountDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountDeleteModal = ({ open, onOpenChange }: AccountDeleteModalProps) => {
  const [confirmation, setConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== "회원탈퇴") {
      toast({ title: "'회원탈퇴'를 정확히 입력해주세요", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "로그인이 필요합니다", variant: "destructive" });
        return;
      }

      const { error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        toast({ title: "탈퇴 처리 중 오류가 발생했습니다", variant: "destructive" });
        return;
      }

      await supabase.auth.signOut();
      toast({ title: "계정이 삭제되었습니다" });
      window.location.href = "/";
    } catch {
      toast({ title: "오류가 발생했습니다", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            회원탈퇴
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            탈퇴하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10">
            <p className="text-xs text-muted-foreground">
              삭제되는 데이터: 가족 건강정보, 운행기록, 결제내역, 리뷰 등 모든 개인 데이터
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-foreground font-medium">
              확인을 위해 <strong className="text-destructive">'회원탈퇴'</strong>를 입력하세요
            </p>
            <Input
              placeholder="회원탈퇴"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="rounded-xl bg-card border-border"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || confirmation !== "회원탈퇴"}
              className="flex-1 rounded-xl"
            >
              {isLoading ? "처리 중..." : "탈퇴하기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDeleteModal;
