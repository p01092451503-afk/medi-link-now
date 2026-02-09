import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Siren, Bed, Clock, Navigation,
  Star, Shield, ArrowRight, Share2, Mic, ChevronRight, AlertTriangle
} from "lucide-react";
import { useTransferMode } from "@/contexts/TransferModeContext";
import PublicDataInfoModal from "@/components/PublicDataInfoModal";
import SubPageHeader from "@/components/SubPageHeader";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const }
  }),
};

const ParamedicLanding = () => {
  const navigate = useNavigate();
  const { setMode } = useTransferMode();
  const [isPublicDataModalOpen, setIsPublicDataModalOpen] = useState(false);

  const features = [
    { icon: Bed, title: "실시간 병상 현황", description: "전국 500+ 응급실 가용 병상 즉시 확인" },
    { icon: Share2, title: "거절 이력 공유", description: "다른 구급대원의 거절 사유 실시간 확인" },
    { icon: Mic, title: "AI 음성 구급일지", description: "음성으로 환자 정보 자동 기록" },
    { icon: Navigation, title: "응급실 입구 로드뷰", description: "정확한 ER 진입로 안내" },
  ];

  const benefits = [
    { icon: Clock, value: "-15분", label: "이송 시간", desc: "병원 선정 단축" },
    { icon: AlertTriangle, value: "0건", label: "거절 감소", desc: "사전 정보 확인" },
  ];

  const handleStartService = () => {
    setMode("emergency");
    navigate("/map?role=paramedic");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SubPageHeader title="119 구급대원" backTo="/" />

      <main className="flex-1 max-w-lg mx-auto w-full">
        {/* Hero */}
        <section className="px-5 pt-10 pb-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-warning/10 rounded-full text-warning text-xs font-semibold mb-5">
              <Siren className="w-3.5 h-3.5" />
              119 구급대원 전용
            </div>
            <h2 className="text-[1.75rem] leading-tight font-extrabold text-foreground mb-3 tracking-tight">
              <span className="text-warning">골든타임</span>을 지키는<br />
              실시간 병상 정보
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              병원 거절로 인한 시간 낭비 없이<br />
              환자를 가장 빠르게 이송하세요
            </p>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mt-7">
            <button
              onClick={handleStartService}
              className="w-full flex items-center justify-center gap-2 py-4 bg-foreground text-background rounded-2xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              지금 시작하기
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              로그인 없이 바로 사용 가능합니다
            </p>
          </motion.div>
        </section>

        {/* Benefits */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={2} className="px-5 pb-8">
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((b) => (
              <div key={b.label} className="bg-card rounded-2xl border border-border p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-2">
                  <b.icon className="w-5 h-5 text-foreground" />
                </div>
                <p className="text-2xl font-extrabold text-foreground">{b.value}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{b.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{b.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Features */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={3} className="px-5 pb-8">
          <p className="text-[13px] font-semibold text-muted-foreground mb-3">주요 기능</p>
          <div className="grid grid-cols-2 gap-2.5">
            {features.map((f) => (
              <div key={f.title} className="bg-card rounded-2xl border border-border p-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-sm text-foreground mb-0.5">{f.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={4} className="px-5 pb-8">
          <p className="text-[13px] font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-warning fill-current" /> 현장 구급대원 후기
          </p>
          <div className="space-y-2.5">
            {[
              { name: "이OO 구급대원", region: "서울소방", comment: "거절 이력 공유 덕분에 시간 낭비가 크게 줄었어요" },
              { name: "정OO 구급대원", region: "경기소방", comment: "응급실 입구 로드뷰가 정말 유용합니다" },
            ].map((t, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                    {t.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.region}</p>
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
            onClick={() => setIsPublicDataModalOpen(true)}
            className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3.5 hover:bg-secondary transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">공공데이터 기반 서비스</p>
              <p className="text-xs text-muted-foreground mt-0.5">국가응급진료정보망(NEDIS) 데이터 활용</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </button>
        </motion.section>
      </main>

      <PublicDataInfoModal isOpen={isPublicDataModalOpen} onClose={() => setIsPublicDataModalOpen(false)} />
    </div>
  );
};

export default ParamedicLanding;
