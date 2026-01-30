import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, Users, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/hooks/useUserRole";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onSelectRole: (role: UserRole) => Promise<void>;
  isLoading?: boolean;
}

const RoleSelectionModal = ({ isOpen, onSelectRole, isLoading }: RoleSelectionModalProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    try {
      await onSelectRole(selectedRole);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">사용자 유형 선택</h2>
              <p className="text-muted-foreground text-sm">
                서비스 이용을 위해 역할을 선택해주세요
              </p>
            </div>

            {/* Role Options */}
            <div className="space-y-3">
              {/* Guardian Option */}
              <button
                onClick={() => setSelectedRole("guardian")}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                  selectedRole === "guardian"
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                    selectedRole === "guardian"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Users className="w-7 h-7" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg text-foreground">보호자</h3>
                  <p className="text-sm text-muted-foreground">
                    가까운 응급실 찾기, 가족 의료정보 관리
                  </p>
                </div>
                {selectedRole === "guardian" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center"
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                )}
              </button>

              {/* Driver Option */}
              <button
                onClick={() => setSelectedRole("driver")}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                  selectedRole === "driver"
                    ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                    selectedRole === "driver"
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Ambulance className="w-7 h-7" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg text-foreground">구급대원</h3>
                  <p className="text-sm text-muted-foreground">
                    이송 관리, 환자정보 공유, 실시간 리포트
                  </p>
                </div>
                {selectedRole === "driver" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                )}
              </button>
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handleConfirm}
              disabled={!selectedRole || isSubmitting || isLoading}
              className={`w-full h-14 text-lg font-semibold rounded-xl transition-all ${
                selectedRole === "driver"
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  처리 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  시작하기
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              선택한 역할은 나중에 설정에서 변경할 수 있습니다
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RoleSelectionModal;
