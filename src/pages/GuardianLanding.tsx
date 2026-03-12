import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Heart, 
  Baby, 
  Search,
  Users,
  ArrowRight,
  Calculator,
  Pill,
  ChevronRight,
  Phone,
  Calendar,
  Ambulance
} from "lucide-react";
import TargetUserInfoModal from "@/components/TargetUserInfoModal";
import SubPageHeader from "@/components/SubPageHeader";
import ScheduledCallForm from "@/components/ScheduledCallForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type TargetUserType = "parents" | "elderly" | "chronic" | null;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const }
  }),
};

const GuardianLanding = () => {
  const navigate = useNavigate();
  const [selectedUserType, setSelectedUserType] = useState<TargetUserType>(null);
  const [isScheduledOpen, setIsScheduledOpen] = useState(false);

  const features = [
    { icon: Search, title: "AI 증상 검색", description: "증상을 입력하면 AI가 적합한 병원을 추천" },
    { icon: MapPin, title: "실시간 병상 현황", description: "전국 120+ 응급실 병상 정보 실시간 확인" },
    { icon: Heart, title: "가족 의료 카드", description: "가족 건강정보 저장으로 응급상황 대비" },
  ];

  const targetUsers: { icon: typeof Baby; label: string; desc: string; type: TargetUserType }[] = [
    { icon: Baby, label: "아이를 키우는 부모님", desc: "소아응급 병원 빠르게 찾기", type: "parents" },
    { icon: Users, label: "어르신을 모시는 분", desc: "24시간 응급실 현황 확인", type: "elderly" },
    { icon: Heart, label: "만성질환 환자 가족", desc: "전문 진료 가능 병원 검색", type: "chronic" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SubPageHeader title="보호자 / 환자" backTo="/" />

      <main className="flex-1 max-w-lg mx-auto w-full">
        {/* Hero */}
        <section className="px-5 pt-10 pb-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full text-primary text-xs font-semibold mb-5">
              <Users className="w-3.5 h-3.5" />
              보호자 / 환자 모드
            </div>
            <h2 className="text-[1.75rem] leading-tight font-extrabold text-foreground mb-3 tracking-tight">
              응급 상황,<br />
              <span className="text-primary">1분 1초</span>가 생명입니다
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              아이가 아플 때, 부모님이 쓰러지셨을 때<br />
              가장 가까운 응급실을 빠르게 찾아드립니다
            </p>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mt-7">
            <button
              onClick={() => navigate("/map")}
              className="w-full flex items-center justify-center gap-2 py-4 bg-foreground text-background rounded-2xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              응급실 찾기
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </section>

        {/* Features */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={2} className="px-5 pb-8">
          <p className="text-[13px] font-semibold text-muted-foreground mb-3">주요 기능</p>
          <div className="space-y-2">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-3.5 p-4 bg-card rounded-2xl border border-border">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Target Users */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={3} className="px-5 pb-8">
          <p className="text-[13px] font-semibold text-muted-foreground mb-3">이런 분들을 위해</p>
          <div className="space-y-2">
            {targetUsers.map((user) => (
              <button
                key={user.label}
                onClick={() => setSelectedUserType(user.type)}
                className="w-full flex items-center gap-3.5 p-4 bg-card rounded-2xl border border-border hover:bg-secondary transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <user.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{user.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </button>
            ))}
          </div>
        </motion.section>

        {/* Quick Links */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={4} className="px-5 pb-8">
          <p className="text-[13px] font-semibold text-muted-foreground mb-3">더 알아보기</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => navigate("/map")}
              className="flex items-center gap-3 p-4 bg-foreground text-background rounded-2xl hover:opacity-90 transition-opacity"
            >
              <Ambulance className="w-5 h-5" />
              <div className="text-left">
                <p className="text-sm font-bold">사설 구급차</p>
                <p className="text-[10px] opacity-70">즉시 호출</p>
              </div>
            </button>
            <button
              onClick={() => setIsScheduledOpen(true)}
              className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border hover:bg-secondary transition-colors"
            >
              <Calendar className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">예약 호출</p>
                <p className="text-[10px] text-muted-foreground">퇴원/전원</p>
              </div>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Heart, label: "가족 카드", onClick: () => navigate("/family") },
              { icon: Calculator, label: "요금 계산", onClick: () => navigate("/fare-calculator") },
              { icon: Pill, label: "소아 약 가이드", onClick: () => navigate("/medicine-guide") },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex flex-col items-center gap-2 p-4 bg-card rounded-2xl border border-border hover:bg-secondary transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Emergency Call */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={5} className="px-5 pb-12">
          <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-danger flex items-center justify-center">
                <Phone className="w-5 h-5 text-danger-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">긴급 상황 시</p>
                <p className="text-xs text-muted-foreground">생명이 위급하면 즉시 신고하세요</p>
              </div>
            </div>
            <a href="tel:119" className="px-4 py-2 bg-danger text-danger-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
              119
            </a>
          </div>
        </motion.section>
      </main>

      <TargetUserInfoModal
        isOpen={selectedUserType !== null}
        onClose={() => setSelectedUserType(null)}
        userType={selectedUserType}
      />

      <ScheduledCallForm
        isOpen={isScheduledOpen}
        onClose={() => setIsScheduledOpen(false)}
        userLocation={null}
      />
    </div>
  );
};

export default GuardianLanding;
