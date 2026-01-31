import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Ambulance, 
  BarChart3, 
  Clock, 
  DollarSign, 
  FileText,
  Navigation,
  Users,
  Star,
  Shield,
  ArrowRight,
  Zap,
  Route,
  ChevronRight,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

const DriverLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: "운행 통계 요약",
      description: "오늘/이번 주 운행 건수 및 거리 요약",
      gradient: "from-blue-500 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
    },
    {
      icon: Route,
      title: "공차 회송 매칭",
      description: "경유 환자 자동 매칭으로 수익 극대화",
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
    },
    {
      icon: FileText,
      title: "자동 운행일지",
      description: "GPS 기반 운행기록 자동 생성 + PDF 출력",
      gradient: "from-orange-500 to-amber-600",
      bgGradient: "from-orange-50 to-amber-50",
    },
    {
      icon: Zap,
      title: "실시간 병상 정보",
      description: "전국 500+ 응급실 실시간 현황",
      gradient: "from-purple-500 to-violet-600",
      bgGradient: "from-purple-50 to-violet-50",
    },
  ];

  const benefits = [
    { icon: DollarSign, value: "+30%", label: "수익 증가", desc: "공차 회송 매칭" },
    { icon: Clock, value: "5분", label: "시간 절감", desc: "자동 운행일지" },
    { icon: Navigation, value: "100%", label: "정확한 진입", desc: "ER 로드뷰" },
  ];

  const testimonials = [
    { name: "김OO 기사님", region: "서울", comment: "회송길 매칭으로 월 수익이 30% 늘었어요" },
    { name: "박OO 기사님", region: "부산", comment: "운행일지 자동생성이 정말 편해요" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-red-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-orange-100">
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
              <span className="font-bold text-slate-800">Find-ER</span>
              <span className="text-sm font-bold text-primary">파인더</span>
              <span className="text-[10px] font-bold text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded-full">Pro</span>
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
          className="text-center pt-8 pb-8"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full text-orange-600 text-sm font-semibold mb-5 border border-orange-200"
          >
            <Ambulance className="w-4 h-4" />
            구급대원 / 기사님 전용
            <Sparkles className="w-3.5 h-3.5" />
          </motion.div>
          
          <h1 className="text-[2rem] leading-tight font-extrabold text-slate-900 mb-4 tracking-tight">
            운행 효율 <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">극대화</span>,<br />
            수익은 <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">2배로</span>
          </h1>
          
          <p className="text-slate-500 text-base leading-relaxed max-w-xs mx-auto">
            빈 차 회송? 이제 <span className="text-slate-700 font-medium">수익으로</span> 바꾸세요<br />
            운행일지 작성에 시간 낭비 그만!
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
              className="bg-gradient-to-br from-white to-orange-50/50 rounded-2xl p-3.5 shadow-sm border border-orange-100 text-center group hover:shadow-md hover:border-orange-200 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-extrabold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">{benefit.value}</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">{benefit.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{benefit.desc}</p>
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
            onClick={() => navigate("/login")}
            className="w-full py-7 rounded-2xl text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-xl shadow-orange-500/30 border-0 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
              <Ambulance className="w-5 h-5" />
            </div>
            드라이버 로그인
            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-xs text-center text-slate-400 mt-3">
            아직 계정이 없으신가요? 로그인 화면에서 가입할 수 있습니다
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

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-red-500 to-orange-500" />
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              현직 기사님들의 후기
            </h2>
          </div>
          
          <div className="space-y-2.5">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.08, duration: 0.3 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-white">{testimonial.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-800">{testimonial.name}</p>
                    <p className="text-xs text-slate-400">{testimonial.region} 지역</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">"{testimonial.comment}"</p>
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
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 flex items-center gap-3.5 border border-emerald-100">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">안전하고 검증된 서비스</p>
              <p className="text-xs text-slate-500 mt-0.5">개인정보 보호 및 운행 데이터 암호화</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DriverLanding;
