import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Shield, 
  Lock, 
  Eye, 
  Server, 
  FileCheck, 
  UserCheck,
  CheckCircle2,
  ShieldCheck,
  Database,
  Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecurityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SecurityInfoModal = ({ isOpen, onClose }: SecurityInfoModalProps) => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "종단간 암호화 (E2E Encryption)",
      description: "모든 데이터는 AES-256 암호화로 전송되며, 제3자가 열람할 수 없습니다.",
      color: "bg-blue-500",
    },
    {
      icon: Database,
      title: "안전한 데이터 저장",
      description: "운행 기록은 암호화된 클라우드에 저장되며, 사용자만 접근할 수 있습니다.",
      color: "bg-emerald-500",
    },
    {
      icon: Fingerprint,
      title: "생체 인증 지원",
      description: "지문, Face ID 등 생체 인증으로 계정을 안전하게 보호합니다.",
      color: "bg-violet-500",
    },
    {
      icon: Eye,
      title: "위치 정보 최소 수집",
      description: "위치 정보는 운행 중에만 수집되며, 운행 종료 후 즉시 익명화됩니다.",
      color: "bg-amber-500",
    },
  ];

  const certifications = [
    { name: "개인정보 보호법 준수", icon: FileCheck },
    { name: "ISMS 보안 기준 적용", icon: ShieldCheck },
    { name: "SSL/TLS 암호화 통신", icon: Lock },
    { name: "정기 보안 감사 시행", icon: UserCheck },
  ];

  const dataHandling = [
    { label: "운행 기록", period: "1년 보관 후 자동 삭제" },
    { label: "위치 정보", period: "운행 종료 후 익명화" },
    { label: "개인 식별 정보", period: "탈퇴 시 즉시 삭제" },
    { label: "결제 정보", period: "PG사 위탁 처리" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[2000]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[2001] max-h-[90vh] bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      안전하고 검증된 서비스
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Find-ER의 보안 및 개인정보 보호 정책
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Trust Banner */}
              <div className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/50 dark:to-blue-950/50 rounded-2xl p-4 mb-6 border border-violet-100 dark:border-violet-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">
                      고객님의 정보는 안전하게 보호됩니다
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      국내 개인정보 보호법 및 국제 보안 표준을 준수합니다
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  보안 기능
                </h3>
                <div className="space-y-3">
                  {securityFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                    >
                      <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center flex-shrink-0`}>
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-white">
                          {feature.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  인증 및 규정 준수
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {certifications.map((cert) => (
                    <div
                      key={cert.name}
                      className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {cert.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Handling */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  데이터 보관 및 처리
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden">
                  {dataHandling.map((item, index) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between px-4 py-3 ${
                        index !== dataHandling.length - 1 ? "border-b border-slate-100 dark:border-slate-700" : ""
                      }`}
                    >
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {item.period}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  개인정보 관련 문의사항이 있으시면 언제든지 연락해 주세요.<br />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    고객센터: support@find-er.kr
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={onClose}
                  className="w-full py-6 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                >
                  확인했습니다
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => window.open("/privacy", "_blank")}
                  className="w-full text-slate-500 dark:text-slate-400 text-sm"
                >
                  개인정보처리방침 전문 보기
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SecurityInfoModal;
