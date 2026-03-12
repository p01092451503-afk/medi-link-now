import { Users, Ambulance, Stethoscope, UserCheck, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type UserRole = "guardian" | "driver" | "paramedic";

const roles: {
  id: UserRole;
  label: string;
  desc: string;
  icon: typeof Users;
  gradient: string;
  selectedBg: string;
  emoji: string;
}[] = [
  {
    id: "guardian",
    label: "보호자 / 환자",
    desc: "응급실 검색 및 가족 관리",
    icon: Users,
    gradient: "from-blue-500 to-blue-600",
    selectedBg: "bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-500",
    emoji: "👨‍👩‍👧",
  },
  {
    id: "driver",
    label: "사설 구급 기사",
    desc: "이송 요청 관리 및 운행 기록",
    icon: Ambulance,
    gradient: "from-emerald-500 to-emerald-600",
    selectedBg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500",
    emoji: "🚑",
  },
  {
    id: "paramedic",
    label: "119 의료진",
    desc: "병상 현황 및 이송 최적화",
    icon: Stethoscope,
    gradient: "from-orange-500 to-orange-600",
    selectedBg: "bg-orange-50 dark:bg-orange-950/30 border-orange-400 dark:border-orange-500",
    emoji: "🏥",
  },
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
      className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
    >
      <UserCheck className="w-8 h-8 text-primary" />
    </motion.div>

    <div>
      <h2 className="text-xl font-bold text-foreground">역할을 선택해주세요</h2>
      <p className="text-xs text-muted-foreground mt-1">역할에 맞는 최적의 화면을 제공합니다</p>
    </div>

    <div className="flex flex-col gap-3 w-full max-w-sm">
      {roles.map(({ id, label, desc, icon: Icon, gradient, selectedBg, emoji }, i) => {
        const isSelected = selected === id;
        return (
          <motion.button
            key={id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(id)}
            className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden ${
              isSelected
                ? `${selectedBg} shadow-lg`
                : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm"
            }`}
          >
            {/* Subtle gradient overlay when selected */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/[0.03] pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Icon container */}
            <motion.div
              animate={isSelected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                isSelected
                  ? `bg-gradient-to-br ${gradient} shadow-md`
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Icon className={`w-6 h-6 ${isSelected ? "text-white" : ""}`} />
              {/* Emoji badge */}
              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0, y: 4 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 text-sm"
                  >
                    {emoji}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-[15px] transition-colors ${
                isSelected ? "text-foreground" : "text-foreground/80"
              }`}>
                {label}
              </div>
              <div className={`text-xs mt-0.5 transition-colors ${
                isSelected ? "text-foreground/60" : "text-muted-foreground"
              }`}>
                {desc}
              </div>
            </div>

            {/* Right indicator */}
            <div className="shrink-0">
              <AnimatePresence mode="wait">
                {isSelected ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
                  >
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="arrow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
