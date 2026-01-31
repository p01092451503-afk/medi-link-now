import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Banknote,
  CreditCard,
  Building2,
  AlertCircle,
  Receipt,
} from "lucide-react";

export type PaymentMethod = "cash" | "card" | "transfer" | "unpaid";

interface FareInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    revenueAmount: number;
    paymentMethod: PaymentMethod;
    revenueMemo?: string;
  }) => void;
  hospitalName?: string;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "cash", label: "현금", icon: Banknote },
  { value: "card", label: "카드", icon: CreditCard },
  { value: "transfer", label: "계좌이체", icon: Building2 },
  { value: "unpaid", label: "미수금", icon: AlertCircle },
];

const FareInputModal = ({ isOpen, onClose, onSubmit, hospitalName }: FareInputModalProps) => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [memo, setMemo] = useState("");

  const handleSubmit = () => {
    const revenueAmount = parseInt(amount.replace(/,/g, ""), 10);
    if (isNaN(revenueAmount) || revenueAmount < 0) {
      return;
    }

    onSubmit({
      revenueAmount,
      paymentMethod,
      revenueMemo: memo || undefined,
    });

    // Reset form
    setAmount("");
    setPaymentMethod("cash");
    setMemo("");
  };

  const handleSkip = () => {
    onClose();
    setAmount("");
    setPaymentMethod("cash");
    setMemo("");
  };

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    if (!numericValue) return "";
    return parseInt(numericValue, 10).toLocaleString();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(formatAmount(e.target.value));
  };

  // Quick amount buttons
  const quickAmounts = [50000, 100000, 150000, 200000];

  return (
    <Dialog open={isOpen} onOpenChange={handleSkip}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            운행 요금 입력
          </DialogTitle>
        </DialogHeader>

        {hospitalName && (
          <p className="text-sm text-muted-foreground -mt-2">
            {hospitalName} 이송 완료
          </p>
        )}

        <div className="space-y-6 py-4">
          {/* Amount Input */}
          <div className="space-y-3">
            <Label htmlFor="amount">이번 운행 요금은 얼마입니까?</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₩
              </span>
              <Input
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="pl-8 text-lg font-semibold text-right"
                inputMode="numeric"
              />
            </div>
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(value.toLocaleString())}
                  className="text-xs"
                >
                  {(value / 10000).toFixed(0)}만원
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>결제 방식</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="grid grid-cols-2 gap-3"
            >
              {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                <div key={value}>
                  <RadioGroupItem
                    value={value}
                    id={value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={value}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === value
                        ? value === "unpaid"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label htmlFor="memo">메모 (선택)</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="추가 메모를 입력하세요..."
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleSkip}>
            나중에
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!amount || parseInt(amount.replace(/,/g, ""), 10) <= 0}
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FareInputModal;
