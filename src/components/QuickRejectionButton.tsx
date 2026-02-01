import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ban, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHARED_REJECTION_REASONS, useSharedRejectionLogs } from "@/hooks/useSharedRejectionLogs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface QuickRejectionButtonProps {
  hospitalId: number;
  hospitalName: string;
  variant?: "button" | "icon";
  className?: string;
}

const QuickRejectionButton = ({ 
  hospitalId, 
  hospitalName, 
  variant = "button",
  className = "" 
}: QuickRejectionButtonProps) => {
  const { user } = useAuth();
  const { addRejectionReport } = useSharedRejectionLogs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customNote, setCustomNote] = useState("");

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({ title: "거절 사유를 선택해주세요", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await addRejectionReport(
        hospitalId,
        hospitalName,
        selectedReason,
        selectedReason === 'other' ? customNote : undefined
      );
      
      toast({ 
        title: "제보 완료 🚨",
        description: "동료 대원들에게 실시간으로 공유됩니다.",
      });
      
      setIsModalOpen(false);
      setSelectedReason(null);
      setCustomNote("");
    } catch (err) {
      console.error('Error submitting rejection report:', err);
      toast({ 
        title: "제보 실패", 
        description: "다시 시도해주세요.",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {variant === "button" ? (
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="outline"
          className={`border-red-300 text-red-600 hover:bg-red-50 ${className}`}
        >
          <Ban className="w-4 h-4 mr-2" />
          방금 거절당함
        </Button>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className={`p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors ${className}`}
          title="거절 신고"
        >
          <Ban className="w-4 h-4 text-red-600" />
        </button>
      )}

      {/* Rejection Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[2000]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl z-[2001] overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Ban className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">거절 사유 선택</h3>
                      <p className="text-white/80 text-xs truncate max-w-[180px]">{hospitalName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3 overflow-y-auto flex-1">
                <p className="text-sm text-muted-foreground">
                  이 정보는 동료 대원들과 실시간으로 공유됩니다.
                </p>

                {/* Reason Buttons */}
                <div className="grid grid-cols-1 gap-2">
                  {SHARED_REJECTION_REASONS.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        selectedReason === reason.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300 hover:bg-red-50/50"
                      }`}
                    >
                      <span className="text-xl">{reason.icon}</span>
                      <span className="font-medium text-sm">{reason.label}</span>
                      {selectedReason === reason.id && (
                        <Check className="w-5 h-5 text-red-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom note for "other" */}
                {selectedReason === 'other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <textarea
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="상세 사유를 입력해주세요..."
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={2}
                    />
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedReason || isSubmitting}
                  className="w-full py-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      제보 중...
                    </>
                  ) : (
                    <>
                      🚨 동료에게 알리기
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickRejectionButton;
