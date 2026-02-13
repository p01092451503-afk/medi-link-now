import { useState } from "react";
import { DollarSign, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DriverBidFormProps {
  onSubmit: (amount: number, message?: string) => Promise<any>;
  isLoading: boolean;
  existingBid?: boolean;
}

const DriverBidForm = ({ onSubmit, isLoading, existingBid }: DriverBidFormProps) => {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    const num = parseInt(amount);
    if (!num || num < 10000) return;
    await onSubmit(num, message || undefined);
    setAmount("");
    setMessage("");
  };

  if (existingBid) {
    return (
      <div className="bg-secondary rounded-2xl p-4 text-center">
        <p className="text-sm text-foreground font-medium">✅ 입찰 완료</p>
        <p className="text-xs text-muted-foreground mt-1">보호자의 선택을 기다리고 있습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-card rounded-2xl p-4 border border-border">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        입찰하기
      </h4>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">제시 금액 (원)</label>
        <Input
          type="number"
          placeholder="예: 70000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-xl"
          min={10000}
          step={5000}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">메시지 (선택)</label>
        <Textarea
          placeholder="예: 특수 장비 보유, 경력 5년"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="rounded-xl"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !amount}
        className="w-full rounded-xl bg-foreground text-background hover:opacity-90"
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-1" /> 제출 중...</>
        ) : (
          <><Send className="w-4 h-4 mr-1" /> 입찰 제출</>
        )}
      </Button>
    </div>
  );
};

export default DriverBidForm;
