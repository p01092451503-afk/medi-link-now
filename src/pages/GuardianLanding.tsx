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
  Bell,
  Users,
  Stethoscope,
  ArrowRight,
  Ambulance
} from "lucide-react";
import { Button } from "@/components/ui/button";

const GuardianLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Search,
      title: "AI 증상 검색",
      description: "증상을 입력하면 AI가 적합한 병원을 추천",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: MapPin,
      title: "실시간 병상 현황",
      description: "전국 120+ 응급실 병상 정보 실시간 확인",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Clock,
      title: "예상 이동 시간",
      description: "가까운 병원까지의 도착 예상 시간 안내",
      color: "bg-orange-100 text-orange-600",
    },
    {
      icon: Heart,
      title: "가족 의료 카드",
      description: "가족 건강정보 저장으로 응급상황 대비",
      color: "bg-pink-100 text-pink-600",
    },
  ];

  const targetUsers = [
    { icon: Baby, label: "아이를 키우는 부모님", desc: "소아응급 병원 빠르게 찾기" },
    { icon: Users, label: "어르신을 모시는 분", desc: "24시간 응급실 현황 확인" },
    { icon: Heart, label: "만성질환 환자 가족", desc: "전문 진료 가능 병원 검색" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-blue-50">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-sm">← 돌아가기</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Ambulance className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-foreground">Find-ER</span>
            <span className="text-[10px] text-muted-foreground ml-1">파인더</span>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            보호자 / 환자 모드
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            응급 상황,<br />
            <span className="text-primary">1분 1초</span>가 생명입니다
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto text-base">
            아이가 아플 때, 부모님이 쓰러지셨을 때,<br />
            가장 가까운 응급실을 빠르게 찾아드립니다
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          {features.map((feature, index) => (
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

        {/* Target Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 text-center">
            이런 분들을 위한 서비스입니다
          </h2>
          <div className="space-y-2">
            {targetUsers.map((user) => (
              <div
                key={user.label}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-border"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <user.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{user.label}</p>
                  <p className="text-xs text-muted-foreground">{user.desc}</p>
                </div>
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
            onClick={() => navigate("/map")}
            className="w-full py-7 rounded-2xl text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
          >
            <MapPin className="w-5 h-5 mr-2" />
            응급실 찾기
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <Button
            onClick={() => navigate("/family")}
            variant="outline"
            className="w-full py-5 rounded-2xl text-base font-medium border-2"
          >
            <Heart className="w-5 h-5 mr-2 text-pink-500" />
            가족 의료정보 등록하기
          </Button>
        </motion.div>

        {/* Emergency Call */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-center"
        >
          <a
            href="tel:119"
            className="inline-flex items-center gap-2 text-destructive font-semibold hover:underline text-lg"
          >
            <Phone className="w-5 h-5" />
            긴급 상황? 119 바로 전화
          </a>
          <p className="text-xs text-muted-foreground mt-2">
            생명이 위급한 상황에서는 즉시 119에 신고하세요
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default GuardianLanding;
