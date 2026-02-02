import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Clock, 
  Phone, 
  Heart, 
  Baby, 
  Search,
  Users,
  ArrowRight,
  Ambulance,
  Calculator,
  Activity,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const GuardianLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Search,
      title: "AI 증상 검색",
      description: "증상을 입력하면 AI가 적합한 병원을 추천",
    },
    {
      icon: MapPin,
      title: "실시간 병상 현황",
      description: "전국 120+ 응급실 병상 정보 실시간 확인",
    },
    {
      icon: Clock,
      title: "예상 이동 시간",
      description: "가까운 병원까지의 도착 예상 시간 안내",
    },
    {
      icon: Heart,
      title: "가족 의료 카드",
      description: "가족 건강정보 저장으로 응급상황 대비",
    },
  ];

  const targetUsers = [
    { icon: Baby, label: "아이를 키우는 부모님", desc: "소아응급 병원 빠르게 찾기" },
    { icon: Users, label: "어르신을 모시는 분", desc: "24시간 응급실 현황 확인" },
    { icon: Heart, label: "만성질환 환자 가족", desc: "전문 진료 가능 병원 검색" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-blue-100">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-blue-500 hover:text-blue-700 transition-colors text-sm font-medium"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            돌아가기
          </button>
          <span className="font-logo font-extrabold text-slate-800">Find-ER</span>
        </div>
      </header>

      <main className="px-5 pb-12 max-w-lg mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center pt-8 pb-10"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-600 text-sm font-semibold mb-5 border border-blue-200"
          >
            <Users className="w-4 h-4" />
            보호자 / 환자 모드
          </motion.div>
          
          <h1 className="text-[2rem] leading-tight font-extrabold text-slate-900 mb-4 tracking-tight">
            응급 상황,<br />
            <span className="text-blue-600">1분 1초</span>가 생명입니다
          </h1>
          
          <p className="text-slate-500 text-base leading-relaxed max-w-xs mx-auto">
            아이가 아플 때, 부모님이 쓰러지셨을 때<br />
            <span className="text-blue-700 font-medium">가장 가까운 응급실</span>을 빠르게 찾아드립니다
          </p>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-10"
        >
          <Button
            onClick={() => navigate("/map")}
            className="w-full py-7 rounded-2xl text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 border-0 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            응급실 찾기
            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 gap-3 mb-10"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + index * 0.05, duration: 0.3 }}
              className="relative bg-white rounded-2xl p-4 border border-blue-100 overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors duration-300">
                <feature.icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 mb-1">{feature.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Target Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-blue-600" />
            <h2 className="text-sm font-bold text-slate-700">이런 분들을 위한 서비스입니다</h2>
          </div>
          
          <div className="space-y-2.5">
            {targetUsers.map((user, index) => (
              <motion.div
                key={user.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.08, duration: 0.3 }}
                className="flex items-center gap-3.5 bg-white rounded-2xl p-4 border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <user.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800">{user.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Secondary CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-3 mb-10"
        >
          <Button
            onClick={() => navigate("/family")}
            variant="outline"
            className="w-full py-5 rounded-2xl text-base font-semibold border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
              <Heart className="w-4 h-4 text-blue-600" />
            </div>
            가족 의료정보 등록하기
          </Button>

          <Button
            onClick={() => navigate("/fare-calculator")}
            variant="outline"
            className="w-full py-5 rounded-2xl text-base font-semibold border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
              <Calculator className="w-4 h-4 text-blue-600" />
            </div>
            구급차 요금 계산기
          </Button>
        </motion.div>

        {/* Emergency Call */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex flex-col items-center gap-3 px-6 py-5 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-xs font-medium text-blue-600">긴급 상황 시</span>
            </div>
            <a
              href="tel:119"
              className="flex items-center gap-2.5 text-slate-800 font-bold text-xl hover:text-slate-900 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                <Phone className="w-5 h-5 text-white" />
              </div>
              119 바로 전화
            </a>
            <p className="text-xs text-blue-500">
              생명이 위급한 상황에서는 즉시 119에 신고하세요
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default GuardianLanding;
