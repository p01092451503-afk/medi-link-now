import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Baby, 
  Users, 
  Heart, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Shield, 
  Stethoscope,
  AlertTriangle,
  Phone,
  Activity,
  Thermometer,
  Pill,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type TargetUserType = "parents" | "elderly" | "chronic" | null;

interface TargetUserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: TargetUserType;
}

const TargetUserInfoModal = ({ isOpen, onClose, userType }: TargetUserInfoModalProps) => {
  const navigate = useNavigate();

  const getContentByType = (type: TargetUserType) => {
    switch (type) {
      case "parents":
        return {
          icon: Baby,
          iconBg: "bg-pink-500",
          title: "아이를 키우는 부모님을 위한",
          subtitle: "소아응급 전문 병원 찾기",
          description: "아이가 갑자기 아플 때, 당황하지 마세요. Find-ER이 가장 가까운 소아응급 병원을 빠르게 찾아드립니다.",
          features: [
            { icon: Stethoscope, title: "소아청소년과 전문의 상주", desc: "야간/주말에도 소아 전문의가 있는 병원 확인" },
            { icon: Thermometer, title: "소아 병상 실시간 현황", desc: "소아 전용 병상 가용 여부 즉시 확인" },
            { icon: Clock, title: "24시간 소아응급실", desc: "야간 진료 가능한 소아응급실 위치 안내" },
            { icon: MapPin, title: "최단 거리 안내", desc: "현재 위치에서 가장 가까운 병원 추천" },
          ],
          emergencyTips: [
            "39°C 이상 고열이 지속될 때",
            "호흡 곤란이나 청색증이 있을 때",
            "심한 구토나 설사로 탈수 증상이 있을 때",
            "경련이나 의식 변화가 있을 때",
          ],
          ctaText: "소아응급실 찾기",
          ctaAction: () => navigate("/map?filter=pediatric"),
        };
      case "elderly":
        return {
          icon: Users,
          iconBg: "bg-amber-500",
          title: "어르신을 모시는 분을 위한",
          subtitle: "24시간 응급실 현황 확인",
          description: "어르신이 갑자기 쓰러지셨을 때, 가장 빠르게 대응할 수 있도록 실시간 응급실 정보를 제공합니다.",
          features: [
            { icon: Activity, title: "뇌졸중/심장 전문 병원", desc: "뇌혈관, 심혈관 전문 치료 가능 병원 표시" },
            { icon: Clock, title: "골든타임 안내", desc: "뇌졸중 3시간, 심근경색 90분 내 치료 중요" },
            { icon: MapPin, title: "권역응급의료센터", desc: "중증 응급환자 전문 치료 가능 센터 안내" },
            { icon: Shield, title: "응급실 혼잡도 확인", desc: "대기 시간이 짧은 병원 우선 추천" },
          ],
          emergencyTips: [
            "갑자기 한쪽 팔다리에 힘이 빠질 때 (뇌졸중 의심)",
            "가슴 통증이 15분 이상 지속될 때 (심근경색 의심)",
            "갑자기 말이 어눌해지거나 의식이 흐려질 때",
            "낙상 후 심한 통증이나 움직임 제한이 있을 때",
          ],
          ctaText: "응급실 현황 보기",
          ctaAction: () => navigate("/map"),
        };
      case "chronic":
        return {
          icon: Heart,
          iconBg: "bg-rose-500",
          title: "만성질환 환자 가족을 위한",
          subtitle: "전문 진료 가능 병원 검색",
          description: "당뇨, 고혈압, 심장질환 등 만성질환자의 응급상황에 대비하여 전문 치료가 가능한 병원을 미리 확인하세요.",
          features: [
            { icon: Pill, title: "복용 약물 정보 저장", desc: "가족 의료카드에 약물 정보 저장 가능" },
            { icon: Stethoscope, title: "전문 진료과 검색", desc: "심장내과, 신경과 등 전문과 보유 병원 확인" },
            { icon: Shield, title: "의료 정보 즉시 전달", desc: "응급 상황 시 저장된 의료 정보 활용" },
            { icon: Activity, title: "중환자실 병상 확인", desc: "ICU, CCU 등 중환자 병상 현황 확인" },
          ],
          emergencyTips: [
            "당뇨 환자의 저혈당 쇼크 증상이 있을 때",
            "고혈압 환자의 급격한 혈압 상승 시",
            "투석 환자의 응급 투석이 필요할 때",
            "심장질환자의 부정맥이나 흉통 발생 시",
          ],
          ctaText: "가족 의료카드 만들기",
          ctaAction: () => navigate("/family"),
        };
      default:
        return null;
    }
  };

  const content = getContentByType(userType);

  if (!content) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 px-6 py-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${content.iconBg} flex items-center justify-center shadow-lg`}>
                  <content.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm font-medium">{content.title}</p>
                  <h2 className="text-white text-xl font-bold">{content.subtitle}</h2>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {content.description}
              </p>

              {/* Features */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  주요 기능
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {content.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-slate-800 rounded-xl"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-white">{feature.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Tips */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  이럴 때 응급실을 방문하세요
                </h3>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <ul className="space-y-2">
                    {content.emergencyTips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                        <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 119 Emergency */}
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-red-700 dark:text-red-300">생명이 위급한 상황에서는</p>
                  <p className="text-xs text-red-600 dark:text-red-400">즉시 119에 신고하세요</p>
                </div>
                <a
                  href="tel:119"
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-lg transition-colors"
                >
                  119
                </a>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="p-6 pt-0">
              <Button
                onClick={() => {
                  onClose();
                  content.ctaAction();
                }}
                className="w-full py-5 rounded-2xl text-base font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
              >
                {content.ctaText}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TargetUserInfoModal;
