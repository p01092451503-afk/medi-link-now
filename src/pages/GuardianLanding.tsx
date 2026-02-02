import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Clock, 
  Shield, 
  Phone, 
  Heart, 
  Baby, 
  Search,
  Users,
  ArrowRight,
  Ambulance,
  Calculator,
  Sparkles,
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
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
    },
    {
      icon: MapPin,
      title: "실시간 병상 현황",
      description: "전국 120+ 응급실 병상 정보 실시간 확인",
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      icon: Clock,
      title: "예상 이동 시간",
      description: "가까운 병원까지의 도착 예상 시간 안내",
      gradient: "from-orange-500 to-amber-600",
      bgGradient: "from-orange-50 to-amber-50",
    },
    {
      icon: Heart,
      title: "가족 의료 카드",
      description: "가족 건강정보 저장으로 응급상황 대비",
      gradient: "from-pink-500 to-rose-600",
      bgGradient: "from-pink-50 to-rose-50",
    },
  ];

  const targetUsers = [
    { icon: Baby, label: "아이를 키우는 부모님", desc: "소아응급 병원 빠르게 찾기" },
    { icon: Users, label: "어르신을 모시는 분", desc: "24시간 응급실 현황 확인" },
    { icon: Heart, label: "만성질환 환자 가족", desc: "전문 진료 가능 병원 검색" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            돌아가기
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Ambulance className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-logo font-bold text-slate-800">find-ER</span>
              <span className="font-logo text-sm font-bold text-primary">파인더</span>
            </div>
          </div>
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-full text-primary text-sm font-semibold mb-5 border border-primary/20"
          >
            <Users className="w-4 h-4" />
            보호자 / 환자 모드
            <Sparkles className="w-3.5 h-3.5" />
          </motion.div>
          
          <h1 className="text-[2rem] leading-tight font-extrabold text-slate-900 mb-4 tracking-tight">
            응급 상황,<br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">1분 1초</span>가 생명입니다
          </h1>
          
          <p className="text-slate-500 text-base leading-relaxed max-w-xs mx-auto">
            아이가 아플 때, 부모님이 쓰러지셨을 때<br />
            <span className="text-slate-700 font-medium">가장 가까운 응급실</span>을 빠르게 찾아드립니다
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
            className="w-full py-7 rounded-2xl text-lg font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-xl shadow-primary/30 border-0 group"
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
              className={`relative bg-gradient-to-br ${feature.bgGradient} rounded-2xl p-4 border border-slate-100 overflow-hidden group hover:shadow-lg transition-all duration-300`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 mb-1">{feature.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
              
              {/* Decorative circle */}
              <div className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-gradient-to-br ${feature.gradient} opacity-[0.07]`} />
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
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-blue-600" />
            <h2 className="text-sm font-bold text-slate-700">이런 분들을 위한 서비스입니다</h2>
          </div>
          
          <div className="space-y-2.5">
            {targetUsers.map((user, index) => (
              <motion.div
                key={user.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.08, duration: 0.3 }}
                className="flex items-center gap-3.5 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-blue-500/20 transition-colors">
                  <user.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800">{user.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
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
            className="w-full py-5 rounded-2xl text-base font-semibold border-2 border-slate-200 bg-white hover:bg-pink-50 hover:border-pink-200 hover:text-pink-700 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center mr-3 group-hover:bg-pink-200 transition-colors">
              <Heart className="w-4 h-4 text-pink-500" />
            </div>
            가족 의료정보 등록하기
          </Button>

          <Button
            onClick={() => navigate("/fare-calculator")}
            variant="outline"
            className="w-full py-5 rounded-2xl text-base font-semibold border-2 border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
              <Calculator className="w-4 h-4 text-blue-500" />
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
          <div className="inline-flex flex-col items-center gap-3 px-6 py-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-600">긴급 상황 시</span>
            </div>
            <a
              href="tel:119"
              className="flex items-center gap-2.5 text-red-600 font-bold text-xl hover:text-red-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Phone className="w-5 h-5 text-white" />
              </div>
              119 바로 전화
            </a>
            <p className="text-xs text-red-400">
              생명이 위급한 상황에서는 즉시 119에 신고하세요
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default GuardianLanding;
