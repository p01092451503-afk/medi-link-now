import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CreditCard, AlertTriangle } from "lucide-react";
import AmbulanceLoader from "@/components/AmbulanceLoader";
import { useAuth } from "@/hooks/useAuth";
import { usePayments } from "@/hooks/usePayments";
import { requestPayment } from "@/services/paymentService";
import { useToast } from "@/hooks/use-toast";

interface PaymentButtonProps {
  amount: number;
  origin: string;
  destination: string;
  distanceKm: number;
  vehicleType: "general" | "special";
  disabled?: boolean;
}

const PaymentButton = ({
  amount,
  origin,
  destination,
  distanceKm,
  vehicleType,
  disabled,
}: PaymentButtonProps) => {
  const { user } = useAuth();
  const { hasUnpaid, unpaidCount, createPayment, updatePaymentStatus } = usePayments();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [showDeferModal, setShowDeferModal] = useState(false);
  const [deferReason, setDeferReason] = useState("");

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "결제를 위해 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 미결제 건이 있으면 안내
    if (hasUnpaid) {
      setShowUnpaidModal(true);
      return;
    }

    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessing(true);
    try {
      // 1. DB에 결제 레코드 생성
      const record = await createPayment.mutateAsync({
        amount,
        origin,
        destination,
        distanceKm,
        vehicleType,
      });

      // 2. 토스페이먼츠 결제 호출
      try {
        await requestPayment({
          orderId: record.order_id,
          orderName: `구급차 이송 (${distanceKm}km)`,
          amount,
          successUrl: `${window.location.origin}/payments?success=true&paymentId=${record.id}`,
          failUrl: `${window.location.origin}/payments?success=false&paymentId=${record.id}`,
        });
      } catch (tossError: any) {
        // 사용자가 결제를 취소하거나 테스트 모드에서의 에러 처리
        if (tossError?.code === "USER_CANCEL") {
          toast({ title: "결제 취소", description: "결제가 취소되었습니다." });
        } else {
          // 테스트 모드: 직접 paid 처리
          await updatePaymentStatus.mutateAsync({
            paymentId: record.id,
            status: "paid",
            paymentMethod: "테스트결제",
          });
          toast({
            title: "결제 완료 (테스트)",
            description: `₩${amount.toLocaleString()} 결제가 처리되었습니다.`,
          });
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "결제 오류",
        description: "결제 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeferPayment = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await createPayment.mutateAsync({
        amount,
        origin,
        destination,
        distanceKm,
        vehicleType,
        isDeferred: true,
        deferredReason: deferReason || "응급 상황",
        driverConsent: false,
      });
      toast({
        title: "이후 결제 등록",
        description: "응급 상황으로 이후 결제 처리됩니다. 기사 동의가 필요합니다.",
      });
      setShowDeferModal(false);
      setShowUnpaidModal(false);
    } catch {
      toast({
        title: "오류",
        description: "이후 결제 등록에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        onClick={handlePayment}
        disabled={disabled || isProcessing || !amount}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <AmbulanceLoader variant="inline" message="처리 중" />
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            ₩{amount.toLocaleString()} 결제하기
          </>
        )}
      </Button>

      {/* 미결제 안내 모달 */}
      <Dialog open={showUnpaidModal} onOpenChange={setShowUnpaidModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              미결제 건 안내
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              현재 <strong className="text-foreground">{unpaidCount}건</strong>의
              미결제 내역이 있습니다. 미결제 건을 먼저 해결해주세요.
            </p>
            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              응급 상황의 경우 '이후 결제' 옵션을 이용할 수 있습니다.
              단, 기사님 동의가 필요합니다.
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowDeferModal(true)}>
              응급: 이후 결제
            </Button>
            <Button onClick={() => setShowUnpaidModal(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이후 결제 모달 */}
      <Dialog open={showDeferModal} onOpenChange={setShowDeferModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>이후 결제 요청</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              응급 상황으로 이후 결제를 요청합니다. 기사님의 동의 후 이송이
              진행됩니다.
            </p>
            <div className="space-y-2">
              <Label>사유 (선택)</Label>
              <Textarea
                value={deferReason}
                onChange={(e) => setDeferReason(e.target.value)}
                placeholder="응급 상황 사유를 입력해주세요..."
                className="resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeferModal(false)}>
              취소
            </Button>
            <Button onClick={handleDeferPayment} disabled={isProcessing}>
              {isProcessing ? "처리 중..." : "이후 결제 요청"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentButton;
