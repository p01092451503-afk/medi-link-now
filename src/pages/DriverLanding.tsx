import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Ambulance, 
  BarChart3, 
  Clock, 
  DollarSign, 
  Phone, 
  FileText,
  Navigation,
  TrendingUp,
  Users,
  Star,
  Shield,
  ArrowRight,
  Zap,
  Route
} from "lucide-react";
import { Button } from "@/components/ui/button";

const DriverLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: "운행 통계 요약",
      description: "오늘/이번 주 운행 건수 및 거리 요약",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Route,
      title: "공차 회송 매칭",
      description: "경유 환자 자동 매칭으로 수익 극대화",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: FileText,
      title: "자동 운행일지",
      description: "GPS 기반 운행기록 자동 생성 + PDF 출력",
      color: "bg-orange-100 text-orange-600",
    },
    {
      icon: Zap,
      title: "실시간 병상 정보",
      description: "전국 500+ 응급실 실시간 현황",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const benefits = [
    { icon: DollarSign, value: "+30%", label: "평균 수익 증가", desc: "공차 회송 매칭으로" },
    { icon: Clock, value: "5분", label: "서류 작성 절감", desc: "자동 운행일지로" },
    { icon: Navigation, value: "100%", label: "정확한 진입", desc: "ER 로드뷰로" },
  ];

  const testimonials = [
    { name: "김OO 기사님", region: "서울", comment: "회송길 매칭으로 월 수익이 30% 늘었어요" },
    { name: "박OO 기사님", region: "부산", comment: "운행일지 자동생성이 정말 편해요" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-red-50">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-sm">← 돌아가기</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
            <Ambulance className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-foreground">Find-ER</span>
            <span className="text-[10px] text-muted-foreground ml-1">파인더</span>
            <span className="text-xs text-orange-500 font-medium ml-1">Pro</span>
          </div>
        </div>
      </header>

      <main className="px-6 pb-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-100 to-orange-100 rounded-full text-orange-600 text-sm font-medium mb-4">
            <Ambulance className="w-4 h-4" />
            구급대원 / 기사님 전용
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            운행 효율 <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">극대화</span>,<br />
            수익은 <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">2배로</span>
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto text-base">
            빈 차 회송? 이제 수익으로 바꾸세요.<br />
            운행일지 작성에 시간 낭비 그만!
          </p>
        </motion.div>

        {/* Key Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-3 gap-2 mb-6"
        >
          {benefits.map((benefit) => (
            <div
              key={benefit.label}
              className="bg-white rounded-2xl p-3 shadow-sm border border-border text-center"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-100 to-orange-100 flex items-center justify-center mx-auto mb-2">
                <benefit.icon className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-xl font-bold text-foreground">{benefit.value}</p>
              <p className="text-xs font-medium text-foreground">{benefit.label}</p>
              <p className="text-[10px] text-muted-foreground">{benefit.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-4 shadow-sm border border-border"
            >
              <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center mb-3`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 text-center flex items-center justify-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            현직 기사님들의 후기
          </h2>
          <div className="space-y-2">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-100 to-orange-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-500">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.region} 지역</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-3"
        >
          <Button
            onClick={() => navigate("/login")}
            className="w-full py-7 rounded-2xl text-lg font-semibold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg"
          >
            <Ambulance className="w-5 h-5 mr-2" />
            드라이버 로그인
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            아직 계정이 없으신가요? 로그인 화면에서 가입할 수 있습니다
          </p>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8"
        >
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">안전하고 검증된 서비스</p>
              <p className="text-xs text-muted-foreground">개인정보 보호 및 운행 데이터 암호화</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DriverLanding;
