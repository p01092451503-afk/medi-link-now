import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, X, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRejectionLogs, REJECTION_REASONS } from "@/hooks/useRejectionLogs";
import { useTransferRequest } from "@/contexts/TransferRequestContext";
import { usePrivateTraffic } from "@/contexts/PrivateTrafficContext";
import { toast } from "@/hooks/use-toast";

interface TransferResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: number;
  hospitalName: string;
  requestId: string;
}

type Step = "ask" | "reason" | "done";

const TransferResultModal = ({
  isOpen,
  onClose,
  hospitalId,
  hospitalName,
  requestId,
}: TransferResultModalProps) => {
  const [step, setStep] = useState<Step>("ask");
  const [selectedReason, setSelectedReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addLog } = useRejectionLogs();
  const { updateRequestStatus } = useTransferRequest();
  const { incrementTraffic } = usePrivateTraffic();

  const handleAccepted = () => {
    updateRequestStatus(requestId, "accepted");
    incrementTraffic(hospitalId);

    toast({
      title: "요청 승인됨",
      description: `${hospitalName}에서 이송 요청을 승인했습니다.`,
    });

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("이송 요청 승인됨!", {
        body: `${hospitalName}에서 이송 요청을 승인했습니다.`,
        icon: "/favicon.png",
      });
    }

    setStep("done");
    setTimeout(() => {
      handleClose();
    }, 1200);
  };

  const handleRejected = () => {
    setStep("reason");
  };

  const handleSubmitRejection = async () => {
    if (!selectedReason) {
      toast({
        title: "거절 사유를 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addLog(hospitalId, hospitalName, selectedReason);
      updateRequestStatus(requestId, "rejected");

      toast({
        title: "거절 이력 기록 완료",
        description: `${hospitalName} - ${REJECTION_REASONS.find((r) => r.id === selectedReason)?.label}`,
      });

      setStep("done");
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (error) {
      console.error("Error logging rejection:", error);
      toast({
        title: "기록 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep("ask");
    setSelectedReason("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-[1200]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-background rounded-3xl shadow-2xl z-[1201] max-w-md mx-auto overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">요청 결과 확인</h2>
                <p className="text-xs text-muted-foreground">{hospitalName}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5">
              {/* Step: Ask Result */}
              {step === "ask" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <p className="text-center text-sm text-muted-foreground mb-6">
                    병원의 응답 결과를 선택해주세요
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleAccepted}
                      className="h-20 flex-col gap-2 rounded-2xl bg-foreground text-background hover:opacity-90"
                    >
                      <CheckCircle className="w-7 h-7" />
                      <span className="font-bold">수용</span>
                    </Button>
                    <Button
                      onClick={handleRejected}
                      variant="outline"
                      className="h-20 flex-col gap-2 rounded-2xl"
                    >
                      <XCircle className="w-7 h-7" />
                      <span className="font-bold">거절</span>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step: Rejection Reason */}
              {step === "reason" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-secondary rounded-2xl p-3">
                    <p className="text-sm text-foreground font-medium">
                      {hospitalName} 거절
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      거절 사유 선택
                    </label>
                    <Select
                      value={selectedReason}
                      onValueChange={setSelectedReason}
                    >
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="사유를 선택해주세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {REJECTION_REASONS.map((reason) => (
                          <SelectItem key={reason.id} value={reason.id}>
                            <span className="flex items-center gap-2">
                              <span>{reason.icon}</span>
                              <span>{reason.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep("ask")}
                      className="flex-1 rounded-2xl"
                    >
                      뒤로
                    </Button>
                    <Button
                      onClick={handleSubmitRejection}
                      disabled={!selectedReason || isSubmitting}
                      className="flex-1 rounded-2xl bg-foreground text-background hover:opacity-90"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "거절 기록 저장"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step: Done */}
              {step === "done" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-foreground" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">기록 완료</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TransferResultModal;