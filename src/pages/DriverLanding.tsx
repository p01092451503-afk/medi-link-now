import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Ambulance, BarChart3, Clock, DollarSign, FileText,
  Navigation, Star, Shield, ArrowRight, Route, ChevronRight
} from "lucide-react";
import SecurityInfoModal from "@/components/SecurityInfoModal";
import SubPageHeader from "@/components/SubPageHeader";
import driverKimAvatar from "@/assets/avatars/driver-kim.jpg";
import driverParkAvatar from "@/assets/avatars/driver-park.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const }
  }),
};

const DriverLanding = () => {
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const navigate = useNavigate();

  const features = [
    { icon: BarChart3, title: "운행 통계 요약", description: "오늘/이번 주 운행 건수 및 거리 요약" },
    { icon: Route, title: "공차 회송 매칭", description: "경유 환자 자동 매칭으로 수익 극대화" },
    { icon: FileText, title: "자동 운행일지", description: "GPS 기반 운행기록 자동 생성 + PDF 출력" },
  ];

  const benefits = [
    { icon: DollarSign, value: "+30%", label: "수익 증가", desc: "공차 회송 매칭" },
    { icon: Clock, value: "5분", label: "시간 절감", desc: "자동 운행일지" },
    { icon: Navigation, value: "100%", label: "정확한 진입", desc: "ER 로드뷰" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SubPageHeader title="민간 구급차" backTo="/" />

      <main className="flex-1 max-w-lg mx-auto w-full">
        {/* Hero */}
        <section className="px-5 pt-10 pb-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-secondary rounded-full text-muted-foreground text-xs font-semibold mb-5">
              <Ambulance className="w-3.5 h-3.5" />
              구급대원 / 기사님 전용
            </div>
            <h2 className="text-[1.75rem] leading-tight font-extrabold text-foreground mb-3 tracking-tight">
              운행 효율 극대화,<br />
              수익은 2배로
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              빈 차 회송? 이제 수익으로 바꾸세요<br />
              운행일지 작성에 시간 낭비 그만!
            </p>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mt-7 space-y-3">
            <button
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 py-4 bg-foreground text-background rounded-2xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              드라이버 로그인
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/driver-registration")}
              className="w-full flex items-center justify-center gap-2 py-3 border border-primary text-primary rounded-2xl font-semibold text-[15px] hover:bg-primary/5 active:scale-[0.98] transition-all"
            >
              <Shield className="w-4 h-4" />
              기사 인증 신청
            </button>
            <p className="text-xs text-center text-muted-foreground">
              아직 계정이 없으신가요? 로그인 화면에서 가입할 수 있습니다
            </p>
          </motion.div>
        </section>

        {/* Benefits */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={2} className="px-5 pb-8">
          <div className="grid grid-cols-3 gap-2.5">
            {benefits.map((b) => (
              <div key={b.label} className="bg-card rounded-2xl border border-border p-3.5 text-center">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-2">
                  <b.icon className="w-5 h-5 text-foreground" />
                </div>
                <p className="text-xl font-extrabold text-foreground">{b.value}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{b.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Features */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={3} className="px-5 pb-8">
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

        {/* Testimonials */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={4} className="px-5 pb-8">
          <p className="text-[13px] font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-warning fill-current" /> 현직 기사님들의 후기
          </p>
          <div className="space-y-2.5">
          {[
              { name: "김OO 기사님", region: "서울", comment: "회송길 매칭으로 월 수익이 30% 늘었어요", avatar: driverKimAvatar },
              { name: "박OO 기사님", region: "부산", comment: "운행일지 자동생성이 정말 편해요", avatar: driverParkAvatar },
            ].map((t, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.region} 지역</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className="w-3 h-3 text-warning fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.comment}"</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Trust */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={5} className="px-5 pb-12">
          <button
            onClick={() => setIsSecurityModalOpen(true)}
            className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3.5 hover:bg-secondary transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">안전하고 검증된 서비스</p>
              <p className="text-xs text-muted-foreground mt-0.5">개인정보 보호 및 운행 데이터 암호화</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </button>
        </motion.section>
      </main>

      <SecurityInfoModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} />
    </div>
  );
};

export default DriverLanding;
