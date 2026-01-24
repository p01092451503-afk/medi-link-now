import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Ambulance, Users, MapPin, Clock, Shield, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Ambulance className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medi-Link</h1>
            <p className="text-xs text-muted-foreground">실시간 응급실 병상 정보</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">
            응급상황,<br />
            <span className="text-primary">가장 가까운 병상</span>을<br />
            찾아드립니다
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            전국 응급실 실시간 병상 현황을 확인하고 가장 빠른 경로를 안내받으세요
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-10 w-full max-w-sm"
        >
          {[
            { icon: MapPin, label: "전국 120+", sub: "응급실" },
            { icon: Clock, label: "실시간", sub: "업데이트" },
            { icon: Shield, label: "안전", sub: "최우선" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-4 shadow-md flex flex-col items-center gap-2"
            >
              <Icon className="w-6 h-6 text-primary" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Role Selection Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-4"
        >
          <p className="text-sm font-medium text-muted-foreground text-center">
            어떤 서비스가 필요하신가요?
          </p>
        </motion.div>

        {/* User Segmentation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-sm space-y-4"
        >
          {/* Guardian Button */}
          <Button
            onClick={() => navigate("/map")}
            className="w-full py-8 rounded-2xl text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center w-full">
              <Users className="w-8 h-8 mr-4" />
              <div className="text-left flex-1">
                <p className="text-lg">보호자 / 환자</p>
                <p className="text-xs font-normal opacity-80">응급실 찾기, 가족 건강관리</p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </Button>

          {/* Ambulance Driver Button */}
          <Button
            onClick={() => navigate("/driver-intro")}
            variant="outline"
            className="w-full py-8 rounded-2xl text-lg font-semibold border-2 border-orange-400 text-orange-600 hover:bg-orange-50 relative overflow-hidden group"
          >
            <div className="relative flex items-center w-full">
              <Ambulance className="w-8 h-8 mr-4" />
              <div className="text-left flex-1">
                <p className="text-lg">구급대원 / 기사님</p>
                <p className="text-xs font-normal opacity-70">수익 최적화, 자동 운행일지</p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </Button>
        </motion.div>

        {/* Emergency Call */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <a
            href="tel:119"
            className="flex items-center gap-2 text-destructive font-semibold hover:underline"
          >
            <Phone className="w-4 h-4" />
            긴급 상황? 119 바로 전화
          </a>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          © 2024 Medi-Link. 응급 의료 정보 서비스
        </p>
      </footer>
    </div>
  );
};

export default Landing;
