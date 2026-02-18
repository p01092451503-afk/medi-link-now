import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Radio, MessageSquare } from "lucide-react";
import { LiveStatusLevel, useSubmitLiveReport } from "@/hooks/useLiveHospitalStatus";
import { toast } from "@/hooks/use-toast";

interface ReportStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: number;
  hospitalName: string;
}

const statusOptions: { level: LiveStatusLevel; emoji: string; label: string; desc: string }[] = [
  { level: "available", emoji: "🟢", label: "여유", desc: "즉시 수용 가능" },
  { level: "busy", emoji: "🟡", label: "혼잡", desc: "대기 발생 / 일부 제한" },
  { level: "full", emoji: "🔴", label: "만실/거절", desc: "수용 불가 / 구급차 거절 중" },
];

const ReportStatusModal = ({ isOpen, onClose, hospitalId, hospitalName }: ReportStatusModalProps) => {
  const [selected, setSelected] = useState<LiveStatusLevel | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitReport } = useSubmitLiveReport();

  const handleSubmit = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await submitReport(hospitalId, selected, comment);
      toast({ title: "제보가 반영되었습니다", description: "30분간 유효합니다" });
      onClose();
      setSelected(null);
      setComment("");
    } catch (err: any) {
      toast({
        title: "제보 실패",
        description: err?.message?.includes("row-level security")
          ? "기사/구급대원 권한이 필요합니다"
          : "잠시 후 다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[1010]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 500 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl z-[1011] max-h-[80vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
            </div>

            <div className="px-5 pb-8 pt-1">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Radio className="w-5 h-5 text-foreground" />
                    <h2 className="text-lg font-bold text-foreground">현재 응급실 상황 제보</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">{hospitalName}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Status Options */}
              <div className="space-y-3 mb-6">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.level}
                    onClick={() => setSelected(opt.level)}
                    className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 ${
                      selected === opt.level
                        ? "bg-foreground text-background ring-2 ring-foreground"
                        : "bg-secondary text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <div className="flex-1">
                      <span className="font-bold text-[15px]">{opt.label}</span>
                      <p className={`text-xs mt-0.5 ${
                        selected === opt.level ? "text-background/70" : "text-muted-foreground"
                      }`}>
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Comment */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">추가 메모 (선택)</span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="예: 뇌출혈 환자 거절, CT 대기 30분"
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <p className="text-[11px] text-muted-foreground mt-1 text-right">{comment.length}/100</p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!selected || isSubmitting}
                className="w-full py-4 rounded-2xl bg-foreground text-background font-semibold text-[15px] disabled:opacity-40 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                {isSubmitting ? "제출 중..." : "제보하기"}
              </button>

              <p className="text-[11px] text-muted-foreground text-center mt-3">
                제보는 30분간 유효하며, 지도와 병원 정보에 반영됩니다
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReportStatusModal;
