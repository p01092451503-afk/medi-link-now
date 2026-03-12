import { Users, Ambulance, Stethoscope, UserCheck, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type UserRole = "guardian" | "driver" | "paramedic";

const roles: {
  id: UserRole;
  label: string;
  desc: string;
  icon: typeof Users;
}[] = [
  { id: "guardian", label: "보호자 / 환자", desc: "응급실 검색 및 가족 관리", icon: Users },
  { id: "driver", label: "사설 구급 기사", desc: "이송 요청 관리 및 운행 기록", icon: Ambulance },
  { id: "paramedic", label: "119 의료진", desc: "병상 현황 및 이송 최적화", icon: Stethoscope },
];

interface StepRoleProps {
  selected: UserRole | null;
  onSelect: (r: UserRole) => void;
}

const StepRole = ({ selected, onSelect }: StepRoleProps) => (
  <div className="flex flex-col items-center text-center gap-6 px-6">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center"
    >
      <UserCheck className="w-8 h-8 text-foreground" />
    </motion.div>

    <div>
      <h2 className="text-xl font-bold text-foreground">역할을 선택해주세요</h2>
      <p className="text-[13px] text-muted-foreground mt-1">역할에 맞는 최적의 화면을 제공합니다</p>
    </div>

    <div className="flex flex-col gap-2.5 w-full max-w-sm">
      {roles.map(({ id, label, desc, icon: Icon }, i) => {
        const isSelected = selected === id;
        return (
          <motion.button
            key={id}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08 + i * 0.06, type: "spring", stiffness: 400, damping: 30 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(id)}
            className={`relative flex items-center gap-4 px-4 py-[18px] rounded-2xl border text-left transition-colors duration-150 ${
              isSelected
                ? "border-foreground/15 bg-secondary shadow-sm"
                : "border-transparent bg-secondary/60 hover:bg-secondary"
            }`}
          >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 transition-colors duration-150 ${
              isSelected
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            }`}>
              <Icon className="w-[22px] h-[22px]" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[15px] text-foreground">{label}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">{desc}</div>
            </div>

            {/* Right indicator */}
            <div className="shrink-0 w-7 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isSelected ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center"
                  >
                    <Check className="w-3.5 h-3.5 text-background" strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="arrow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ChevronRight className="w-[18px] h-[18px] text-muted-foreground/40" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        );
      })}
    </div>
  </div>
);

export default StepRole;
