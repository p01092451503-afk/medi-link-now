import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Siren, 
  Bed,
  Clock, 
  MapPin,
  FileText,
  Navigation,
  Star,
  Shield,
  ArrowRight,
  Zap,
  Share2,
  ChevronRight,
  AlertTriangle,
  Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransferMode } from "@/contexts/TransferModeContext";
import PublicDataInfoModal from "@/components/PublicDataInfoModal";

const ParamedicLanding = () => {
  const navigate = useNavigate();
  const { setMode } = useTransferMode();
  const [isPublicDataModalOpen, setIsPublicDataModalOpen] = useState(false);

  const features = [
    {
      icon: Bed,
      title: "실시간 병상 현황",
      description: "전국 500+ 응급실 가용 병상 즉시 확인",
    },
    {
      icon: Share2,
      title: "거절 이력 공유",
      description: "다른 구급대원의 거절 사유 실시간 확인",
    },
    {
      icon: Mic,
      title: "AI 음성 구급일지",
      description: "음성으로 환자 정보 자동 기록",
    },
    {
      icon: Navigation,
      title: "응급실 입구 로드뷰",
      description: "정확한 ER 진입로 안내",
    },
  ];

  const benefits = [
    { icon: Clock, value: "-15분", label: "이송 시간", desc: "병원 선정 단축" },
    { icon: AlertTriangle, value: "0건", label: "거절 감소", desc: "사전 정보 확인" },
    { icon: Zap, value: "실시간", label: "데이터 갱신", desc: "5분 주기 업데이트" },
  ];

  const testimonials = [
    { name: "이OO 구급대원", region: "서울소방", comment: "거절 이력 공유 덕분에 시간 낭비가 크게 줄었어요" },
    { name: "정OO 구급대원", region: "경기소방", comment: "응급실 입구 로드뷰가 정말 유용합니다" },
  ];

  const handleStartService = () => {
    setMode("emergency");
    navigate("/map?role=paramedic");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-slate-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-orange-100 dark:border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors text-sm font-medium"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            돌아가기
          </button>
          <div className="flex items-baseline gap-1">
            <span className="font-logo font-extrabold text-slate-800 dark:text-white">Find-ER</span>
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-1.5 py-0.5 rounded-full">119</span>
          </div>
        </div>
      </header>

      <main className="px-5 pb-12 max-w-lg mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center pt-8 pb-8"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/40 rounded-full text-orange-700 dark:text-orange-300 text-sm font-semibold mb-5 border border-orange-200 dark:border-orange-800"
          >
            <Siren className="w-4 h-4" />
            119 구급대원 전용
          </motion.div>
          
          <h1 className="text-[2rem] leading-tight font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            <span className="text-orange-600 dark:text-orange-400">골든타임</span>을 지키는<br />
            실시간 병상 정보
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-xs mx-auto">
            병원 거절로 인한 시간 낭비 없이<br />
            <span className="text-orange-600 dark:text-orange-400 font-medium">환자를 가장 빠르게</span> 이송하세요
          </p>
        </motion.div>

        {/* Key Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-3 gap-2.5 mb-8"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-sm border border-orange-100 dark:border-slate-700 text-center group hover:shadow-md hover:border-orange-200 dark:hover:border-slate-600 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-orange-500 dark:bg-orange-600 flex items-center justify-center mx-auto mb-2.5 group-hover:bg-orange-600 dark:group-hover:bg-orange-500 transition-colors duration-300">
                <benefit.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{benefit.value}</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{benefit.label}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{benefit.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-8"
        >
          <Button
            onClick={handleStartService}
            className="w-full py-7 rounded-2xl text-lg font-bold bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 shadow-lg shadow-orange-500/25 dark:shadow-orange-600/20 border-0 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
              <Siren className="w-5 h-5" />
            </div>
            지금 시작하기
            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-3">
            로그인 없이 바로 사용 가능합니다
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + index * 0.05, duration: 0.3 }}
              className="relative bg-white dark:bg-slate-800 rounded-2xl p-4 border border-orange-100 dark:border-slate-700 overflow-hidden group hover:shadow-md hover:border-orange-200 dark:hover:border-slate-600 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors duration-300">
                <feature.icon className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-1">{feature.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-orange-400" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              현장 구급대원 후기
            </h2>
          </div>
          
          <div className="space-y-2.5">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.08, duration: 0.3 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-orange-100 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{testimonial.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-800 dark:text-white">{testimonial.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{testimonial.region}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">"{testimonial.comment}"</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="bg-orange-50 dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-3.5 border border-orange-200 dark:border-slate-700">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">공공데이터 기반 서비스</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">국가응급진료정보망(NEDIS) 데이터 활용</p>
            </div>
            <ChevronRight className="w-4 h-4 text-orange-300 dark:text-slate-600" />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ParamedicLanding;
