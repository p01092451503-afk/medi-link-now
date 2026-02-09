import { useNavigate } from "react-router-dom";
import mark119 from "@/assets/icons/119-mark.png";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ambulance, Users, MapPin, Clock, Shield, Phone, Activity,
  Bed, Hospital, TrendingUp, Navigation, ChevronRight, Zap,
  Globe, HeartPulse, Brain, Target, TrendingDown, Sparkles,
  Locate, Pill, Heart, ArrowRight, BarChart3, AlertTriangle, Moon,
} from "lucide-react";
import { useTransferMode } from "@/contexts/TransferModeContext";
import { useRealtimeHospitals } from "@/hooks/useRealtimeHospitals";
import { useMemo, useState, useEffect } from "react";
import { getHospitalStatus } from "@/data/hospitals";
import { toast } from "@/hooks/use-toast";
import { cleanHospitalName } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const Landing = () => {
  const navigate = useNavigate();
  const { setMode } = useTransferMode();
  const { hospitals, isLoading, lastUpdated } = useRealtimeHospitals();
  const [activeTab, setActiveTab] = useState<"national" | "local">("local");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setLocationDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const requestLocation = () => {
    setIsLocating(true);
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setIsLocating(false);
        setActiveTab("local");
      },
      () => {
        toast({
          title: "위치 권한 필요",
          description: "내 지역 현황을 보려면 위치 권한을 허용해주세요.",
          variant: "destructive",
        });
        setIsLocating(false);
        setLocationDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleLocalTab = () => {
    if (activeTab === "local") return;
    if (!userLocation) {
      requestLocation();
    } else {
      setActiveTab("local");
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const { nationalStats, localStats } = useMemo(() => {
    if (!hospitals.length) return { nationalStats: null, localStats: null };

    const nationalTotalBeds = hospitals.reduce(
      (sum, h) => sum + h.beds.general + h.beds.pediatric + h.beds.fever, 0
    );
    const nationalAvailableHospitals = hospitals.filter(
      (h) => getHospitalStatus(h) === "available"
    ).length;
    const nationalPediatricBeds = hospitals.reduce((sum, h) => sum + h.beds.pediatric, 0);

    const national = {
      totalHospitals: hospitals.length,
      totalBeds: nationalTotalBeds,
      availableHospitals: nationalAvailableHospitals,
      pediatricBeds: nationalPediatricBeds,
    };

    let local = null;
    if (userLocation) {
      const LOCAL_RADIUS_KM = 10;
      const localHospitals = hospitals.filter(h => {
        const distance = calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng);
        return distance <= LOCAL_RADIUS_KM;
      });

      local = {
        totalHospitals: localHospitals.length,
        totalBeds: localHospitals.reduce((sum, h) => sum + h.beds.general + h.beds.pediatric + h.beds.fever, 0),
        availableHospitals: localHospitals.filter((h) => getHospitalStatus(h) === "available").length,
        pediatricBeds: localHospitals.reduce((sum, h) => sum + h.beds.pediatric, 0),
      };
    }

    return { nationalStats: national, localStats: local };
  }, [hospitals, userLocation]);

  const nearestHospitals = useMemo(() => {
    if (!userLocation || !hospitals.length) return [];
    return hospitals
      .map(h => ({
        ...h,
        distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [hospitals, userLocation]);

  const stats = activeTab === "local" ? localStats : nationalStats;

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const }
    }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Toss style minimal */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="px-5 py-4 flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">파인더</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        {/* Hero Section - Toss style big text */}
        <section className="px-5 pt-12 pb-16">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-success" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-success animate-ping opacity-75" />
              </div>
              <span className="text-xs font-semibold text-success">
                {isLoading ? "연결 중..." : `실시간 업데이트 중`}
              </span>
            </div>
            <h2 className="text-[2rem] leading-[1.25] font-extrabold text-foreground mb-5 tracking-tight">
              응급상황에서<br />
              가장 빠른 병상을<br />
              찾아드려요
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              전국 {nationalStats?.totalHospitals ?? "---"}개 응급실의 실시간<br />
              병상 현황을 한눈에 확인하세요.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="mt-8 flex gap-3"
          >
            <button
              onClick={() => navigate("/map")}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-foreground text-background rounded-2xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              응급실 찾기
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/emergency-guide")}
              className="py-4 px-5 bg-secondary text-secondary-foreground rounded-2xl font-semibold text-[15px] hover:opacity-80 active:scale-[0.98] transition-all"
            >
              응급 가이드
            </button>
          </motion.div>
        </section>

        {/* Live Stats Card - Clean card */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
          className="px-5 pb-10"
        >
          <div className="bg-card rounded-3xl border border-border overflow-hidden">
            {/* Tab Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex gap-1 bg-secondary rounded-xl p-1">
                <button
                  onClick={() => setActiveTab("national")}
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                    activeTab === "national"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  전국
                </button>
                <button
                  onClick={handleLocalTab}
                  disabled={isLocating}
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === "local"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  } disabled:opacity-50`}
                >
                  {isLocating ? (
                    <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3" />
                  )}
                  내 주변
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {lastUpdated && (
                  <span>
                    {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <div className="relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-success animate-ping opacity-75" />
                </div>
              </div>
            </div>

            {/* Stats Body */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-5 pb-5"
              >
                {activeTab === "local" && !userLocation ? (
                  <div className="flex flex-col items-center py-10 gap-4">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                      <Locate className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {isLocating ? "위치를 확인하고 있어요" : "위치를 확인하면 주변 응급실을\n바로 보여드려요"}
                    </p>
                    {!isLocating && (
                      <button
                        onClick={requestLocation}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        위치 확인하기
                      </button>
                    )}
                    {isLocating && (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    <StatItem label="응급실" value={stats?.totalHospitals ?? "-"} />
                    <StatItem label="총 병상" value={stats?.totalBeds !== undefined ? stats.totalBeds.toLocaleString() : "-"} />
                    <StatItem label="여유" value={stats?.availableHospitals ?? "-"} highlight />
                    <StatItem label="소아" value={stats?.pediatricBeds !== undefined ? stats.pediatricBeds.toLocaleString() : "-"} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Nearest Hospitals */}
            <AnimatePresence>
              {activeTab === "local" && nearestHospitals.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border"
                >
                  <div className="p-4 space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground mb-3 tracking-wide">가까운 응급실</p>
                    {nearestHospitals.map((hospital, index) => {
                      const status = getHospitalStatus(hospital);
                      const statusColor = status === "available"
                        ? "bg-success" : status === "limited"
                        ? "bg-warning" : "bg-danger";
                      const totalBeds = hospital.beds.general + hospital.beds.pediatric + hospital.beds.fever;

                      return (
                        <button
                          key={hospital.id}
                          onClick={() => navigate(`/map?hospital=${hospital.id}`)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                        >
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-muted-foreground text-xs font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shrink-0`} />
                              <p className="text-sm font-semibold text-foreground truncate">
                                {cleanHospitalName(hospital.nameKr)}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {hospital.distance.toFixed(1)}km · {totalBeds}병상 · ~{Math.round(hospital.distance / 35 * 60)}분
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Service Selection - Toss card grid */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
          className="px-5 pb-10"
        >
          <p className="text-[13px] font-semibold text-muted-foreground mb-4">서비스</p>
          <div className="grid grid-cols-3 gap-2">
            <ServiceCard
              icon={<Users className="w-6 h-6 text-foreground/70" />}
              title="보호자 / 환자"
              subtitle="응급실 찾기"
              onClick={() => navigate("/map")}
              delay={0.35}
            />
            <ServiceCard
              icon={<Ambulance className="w-6 h-6 text-foreground/70" />}
              title="민간 구급차"
              subtitle="전원 · 이송"
              onClick={() => navigate("/driver-intro")}
              delay={0.45}
            />
            <ServiceCard
              icon={<img src={mark119} alt="119" className="w-8 h-8 object-contain" />}
              title="구급대원"
              subtitle="병상 · 거절이력"
              onClick={() => navigate("/paramedic")}
              delay={0.55}
            />
          </div>
        </motion.section>

        {/* Quick Guide - Minimal list */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
          className="px-5 pb-10"
        >
          <p className="text-[13px] font-semibold text-muted-foreground mb-4">응급 가이드</p>
          <div className="space-y-2">
            <GuideRow
              icon={<Pill className="w-5 h-5 text-foreground/70" />}
              title="소아 응급 약 가이드"
              subtitle="해열제 교차복용 타이머 · 복용량 계산"
              onClick={() => navigate("/medicine-guide")}
            />
            <GuideRow
              icon={<Heart className="w-5 h-5 text-foreground/70" />}
              title="응급 행동 가이드"
              subtitle="심폐소생술 · 하임리히 · 뇌졸중 대처법"
              onClick={() => navigate("/emergency-guide")}
            />
          </div>
        </motion.section>

        {/* Trust Indicators - Toss style chips */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={5}
          className="px-5 pb-12"
        >
          <div className="flex flex-wrap gap-2 justify-center">
            <TrustChip icon={<Hospital className="w-3.5 h-3.5" />} label={`${hospitals.length}+ 응급실`} />
            <TrustChip icon={<Zap className="w-3.5 h-3.5" />} label="60초 실시간" highlight />
            <TrustChip icon={<Clock className="w-3.5 h-3.5" />} label="24h 연중무휴" />
            <TrustChip icon={<Brain className="w-3.5 h-3.5" />} label="AI 예측" badge="β" />
            <TrustChip icon={<Moon className="w-3.5 h-3.5" />} label="심야약국" />
            <TrustChip icon={<BarChart3 className="w-3.5 h-3.5" />} label="119 통계" />
          </div>
        </motion.section>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-border bg-card">
        <div className="px-5 py-8 max-w-lg mx-auto space-y-4">
          <p className="text-lg font-bold text-foreground text-center">파인더</p>
          <div className="flex items-center justify-center gap-6">
            <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              이용약관
            </a>
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              개인정보처리방침
            </a>
            <a href="tel:119" className="text-xs text-muted-foreground hover:text-danger transition-colors flex items-center gap-1">
              <Phone className="w-3 h-3" />
              119
            </a>
          </div>
          <div className="pt-3 border-t border-border">
            <p className="text-[11px] text-muted-foreground text-center">
              © 2026 파인더 · 실시간 응급실 병상 정보 서비스
            </p>
            <p className="text-[10px] text-muted-foreground/70 text-center mt-1">
              본 서비스는 정보 제공 목적이며, 응급 시 <span className="font-bold text-danger">119에 신고</span>하세요
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ─── Sub Components ─── */

const StatItem = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
  <div className={`text-center py-3 rounded-xl ${highlight ? "bg-success/10" : ""}`}>
    <p className={`text-xs mb-1 font-medium ${highlight ? "text-success" : "text-muted-foreground"}`}>
      {label}
    </p>
    <p className={`text-xl font-bold leading-none ${highlight ? "text-success" : "text-foreground"}`}>
      {value}
    </p>
  </div>
);

const ServiceCard = ({
  icon, title, subtitle, onClick, delay
}: {
  icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; delay: number;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, type: "spring", stiffness: 200, damping: 20 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2.5 p-4 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-soft transition-all group"
  >
    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
      {icon}
    </div>
    <div className="text-center min-w-0">
      <p className="text-[12px] font-bold text-foreground leading-tight">{title}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{subtitle}</p>
    </div>
  </motion.button>
);

const GuideRow = ({
  icon, title, subtitle, onClick
}: {
  icon: React.ReactNode; title: string; subtitle: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 px-4 py-4 bg-card rounded-2xl border border-border hover:border-primary/20 hover:shadow-soft transition-all group"
  >
    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1 text-left">
      <p className="text-[14px] font-semibold text-foreground">{title}</p>
      <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
  </button>
);

const TrustChip = ({
  icon, label, highlight, badge
}: {
  icon: React.ReactNode; label: string; highlight?: boolean; badge?: string;
}) => (
  <div className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
    highlight
      ? "bg-success/10 text-success border-success/20"
      : "bg-secondary text-muted-foreground border-border"
  }`}>
    {icon}
    <span>{label}</span>
    {badge && (
      <span className="px-1 py-0.5 text-[8px] font-bold text-primary-foreground bg-primary rounded text-center leading-none">
        {badge}
      </span>
    )}
  </div>
);

export default Landing;
