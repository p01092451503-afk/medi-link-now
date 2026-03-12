import { HeartPulse, MapPin, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: HeartPulse, label: "실시간 현황", desc: "응급실 병상" },
  { icon: MapPin, label: "주변 병원", desc: "최단거리 안내" },
  { icon: Shield, label: "안전 이송", desc: "검증된 기사" },
  { icon: Zap, label: "빠른 연결", desc: "원클릭 호출" },
];

const StepIntro = () => (
  <div className="flex flex-col items-center text-center px-6">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      className="w-20 h-20 rounded-3xl bg-foreground flex items-center justify-center mb-6"
    >
      <span className="text-[22px] font-black text-background tracking-tight">파인더</span>
    </motion.div>

    <motion.h1
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-2xl font-bold text-foreground tracking-tight"
    >
      Find-ER에 오신 것을
      <br />
      환영합니다
    </motion.h1>

    <motion.p
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-[13px] text-muted-foreground leading-relaxed max-w-xs mt-3"
    >
      전국 응급실의 <span className="font-semibold text-foreground">실시간 병상 현황</span>을
      확인하고, 가장 가까운 병원을 빠르게 찾으세요.
    </motion.p>

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="grid grid-cols-2 gap-2.5 w-full max-w-xs mt-6"
    >
      {features.map(({ icon: Icon, label, desc }, i) => (
        <motion.div
          key={label}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 + i * 0.08 }}
          className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-secondary/60"
        >
          <div className="w-9 h-9 rounded-xl bg-foreground/[0.06] flex items-center justify-center shrink-0">
            <Icon className="w-[18px] h-[18px] text-foreground/70" />
          </div>
          <div className="text-left">
            <div className="text-[12px] font-semibold text-foreground">{label}</div>
            <div className="text-[10px] text-muted-foreground">{desc}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  </div>
);

export default StepIntro;
