import { Users, Ambulance, Stethoscope, UserCheck, Check } from "lucide-react";
import { motion } from "framer-motion";

export type UserRole = "guardian" | "driver" | "paramedic";

const roles: { id: UserRole; label: string; desc: string; icon: typeof Users }[] = [
  { id: "guardian", label: "보호자 / 환자", desc: "응급실 검색 및 가족 관리", icon: Users },
  { id: "driver", label: "사설 구급 기사", desc: "이송 요청 관리 및 운행 기록", icon: Ambulance },
  { id: "paramedic", label: "119 의료진", desc: "병상 현황 및 이송 최적화", icon: Stethoscope },
];

interface StepRoleProps {
  selected: UserRole | null;
  onSelect: (r: UserRole) => void;
}

const StepRole = ({ selected, onSelect }: StepRoleProps) => (
  <div className="flex flex-col items-center text-center gap-5 px-6">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
    >
      <UserCheck className="w-8 h-8 text-primary" />
    </motion.div>

    <div>
      <h2 className="text-xl font-bold text-foreground">역할을 선택해주세요</h2>
      <p className="text-xs text-muted-foreground mt-1">역할에 맞는 최적의 화면을 제공합니다</p>
    </div>

    <div className="flex flex-col gap-2.5 w-full max-w-sm">
      {roles.map(({ id, label, desc, icon: Icon }, i) => (
        <motion.button
          key={id}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 + i * 0.08 }}
          onClick={() => onSelect(id)}
          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
            selected === id
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border bg-card hover:border-primary/30"
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            selected === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-foreground">{label}</div>
            <div className="text-[11px] text-muted-foreground">{desc}</div>
          </div>
          {selected === id && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Check className="w-5 h-5 text-primary shrink-0" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  </div>
);

export default StepRole;
