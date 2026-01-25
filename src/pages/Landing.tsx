import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Ambulance, Users, MapPin, Clock, Shield, Phone, Activity, Bed, Hospital, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeHospitals } from "@/hooks/useRealtimeHospitals";
import { useMemo } from "react";
import { getHospitalStatus } from "@/data/hospitals";


const Landing = () => {
  const navigate = useNavigate();
  const { hospitals, isLoading, lastUpdated } = useRealtimeHospitals();

  // Calculate real-time statistics
  const stats = useMemo(() => {
    if (!hospitals.length) return null;

    const totalBeds = hospitals.reduce(
      (sum, h) => sum + h.beds.general + h.beds.pediatric + h.beds.fever,
      0
    );
    const availableHospitals = hospitals.filter(
      (h) => getHospitalStatus(h) === "available"
    ).length;
    const pediatricBeds = hospitals.reduce((sum, h) => sum + h.beds.pediatric, 0);

    return {
      totalHospitals: hospitals.length,
      totalBeds,
      availableHospitals,
      pediatricBeds,
    };
  }, [hospitals]);

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
          className="text-center mb-6"
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

        {/* Live Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-sm mb-6"
        >
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 px-4 py-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-white">실시간 전국 현황</span>
                <p className="text-[10px] text-white/70">
                  {isLoading ? "데이터 로딩 중..." : lastUpdated ? `${lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준` : ""}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 p-4">
              {/* Total Hospitals */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Hospital className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.totalHospitals || "---"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">전국 응급실</p>
              </div>
              
              {/* Available Beds */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                    <Bed className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.totalBeds || "---"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">가용 병상</p>
              </div>
              
              {/* Available Hospitals */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.availableHospitals || "---"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">여유 병원</p>
              </div>
              
              {/* Pediatric Beds */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-pink-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-pink-600">
                  {stats?.pediatricBeds || "---"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">소아 병상</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-6 w-full max-w-sm"
        >
          {[
            { icon: MapPin, label: "전국 커버", sub: "응급실" },
            { icon: Clock, label: "실시간", sub: "업데이트" },
            { icon: Shield, label: "안전", sub: "최우선" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="bg-white rounded-xl p-3 shadow-md flex flex-col items-center gap-1"
            >
              <Icon className="w-5 h-5 text-primary" />
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Role Selection Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-3"
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
          className="w-full max-w-sm space-y-3"
        >
          {/* Guardian Button */}
          <button
            onClick={() => navigate("/map")}
            className="w-full h-[72px] px-5 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 relative overflow-hidden group transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center w-full h-full">
              <Users className="w-7 h-7 text-white shrink-0" />
              <div className="text-left flex-1 ml-4 flex flex-col justify-center">
                <p className="text-base font-semibold text-white leading-tight">보호자 / 환자</p>
                <p className="text-xs font-normal text-white/80 leading-tight mt-0.5">응급실 찾기, 가족 건강관리</p>
              </div>
              <span className="text-xl text-white shrink-0">→</span>
            </div>
          </button>

          {/* Ambulance Driver Button */}
          <button
            onClick={() => navigate("/driver-intro")}
            className="w-full h-[72px] px-5 rounded-2xl border-2 border-orange-400 bg-white hover:bg-orange-50 relative overflow-hidden group transition-colors"
          >
            <div className="relative flex items-center w-full h-full">
              <Ambulance className="w-7 h-7 text-orange-500 shrink-0" />
              <div className="text-left flex-1 ml-4 flex flex-col justify-center">
                <p className="text-base font-semibold text-orange-600 leading-tight">구급대원 / 기사님</p>
                <p className="text-xs font-normal text-orange-500/70 leading-tight mt-0.5">수익 최적화, 자동 운행일지</p>
              </div>
              <span className="text-xl text-orange-500 shrink-0">→</span>
            </div>
          </button>
        </motion.div>

        {/* Emergency Call */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6"
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
