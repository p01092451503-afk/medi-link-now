import { Bell, BellOff, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface StepNotificationProps {
  granted: boolean | null;
  onRequest: () => void;
}

const StepNotification = ({ granted, onRequest }: StepNotificationProps) => (
  <div className="flex flex-col items-center text-center gap-5 px-6">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
        granted ? "bg-success/10" : "bg-primary/10"
      }`}
    >
      {granted ? (
        <Check className="w-8 h-8 text-success" />
      ) : (
        <Bell className="w-8 h-8 text-primary" />
      )}
    </motion.div>

    <div>
      <h2 className="text-xl font-bold text-foreground">알림 권한</h2>
      <p className="text-xs text-muted-foreground mt-1">긴급 상황 알림을 받기 위해 필요합니다</p>
    </div>

    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-xs rounded-2xl bg-card border border-border/50 p-5 shadow-sm"
    >
      <div className="flex items-start gap-3 text-left">
        <Bell className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">알림 유형</p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1.5">
            <li>• 모니터링 병원 병상 변동 알림</li>
            <li>• 이송 요청/배차 알림</li>
            <li>• 응급 상황 긴급 알림</li>
          </ul>
        </div>
      </div>
    </motion.div>

    {granted === null && (
      <Button onClick={onRequest} size="lg" className="gap-2 mt-1 rounded-xl">
        <Bell className="w-4 h-4" />
        알림 허용하기
      </Button>
    )}
    {granted === true && (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 text-success font-medium text-sm"
      >
        <Check className="w-5 h-5" /> 알림이 허용되었습니다
      </motion.div>
    )}
    {granted === false && (
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <BellOff className="w-4 h-4" />
        <span>알림이 차단되었습니다. 나중에 설정에서 변경할 수 있습니다.</span>
      </div>
    )}
  </div>
);

export default StepNotification;
