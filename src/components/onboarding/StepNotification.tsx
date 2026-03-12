import { Bell, BellOff, Check, Activity, Truck, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StepNotificationProps {
  granted: boolean | null;
  onRequest: () => void;
}

const notifTypes = [
  { icon: Activity, text: "모니터링 병원 병상 변동 알림" },
  { icon: Truck, text: "이송 요청 및 배차 알림" },
  { icon: AlertTriangle, text: "응급 상황 긴급 알림" },
];

const StepNotification = ({ granted, onRequest }: StepNotificationProps) => (
  <div className="flex flex-col items-center text-center gap-6 px-6">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center"
    >
      <AnimatePresence mode="wait">
        {granted ? (
          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Check className="w-8 h-8 text-foreground" />
          </motion.div>
        ) : (
          <motion.div key="bell" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            <Bell className="w-8 h-8 text-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

    <div>
      <h2 className="text-xl font-bold text-foreground">알림 권한</h2>
      <p className="text-[13px] text-muted-foreground mt-1">긴급 상황 알림을 받기 위해 필요합니다</p>
    </div>

    {/* Notification type cards */}
    <div className="w-full max-w-xs space-y-2">
      {notifTypes.map(({ icon: Icon, text }, i) => (
        <motion.div
          key={text}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 + i * 0.06 }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/60 text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-foreground/[0.06] flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-foreground/60" />
          </div>
          <span className="text-[13px] text-foreground/80">{text}</span>
        </motion.div>
      ))}
    </div>

    {/* Action / status */}
    <AnimatePresence mode="wait">
      {granted === null && (
        <motion.button
          key="request"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRequest}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-foreground text-background font-semibold text-[14px] transition-opacity hover:opacity-90"
        >
          <Bell className="w-4 h-4" />
          알림 허용하기
        </motion.button>
      )}
      {granted === true && (
        <motion.div
          key="granted"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-secondary"
        >
          <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-background" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-medium text-foreground">알림이 허용되었습니다</span>
        </motion.div>
      )}
      {granted === false && (
        <motion.div
          key="denied"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-muted-foreground text-[12px]"
        >
          <BellOff className="w-4 h-4 shrink-0" />
          <span>알림이 차단되었습니다. 나중에 설정에서 변경할 수 있습니다.</span>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default StepNotification;
