import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Thermometer, Droplets, RotateCcw, Bell, BellOff, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type MedicineType = "acetaminophen" | "ibuprofen";

interface DoseRecord {
  type: MedicineType;
  timestamp: number;
}

const INTERVALS: Record<MedicineType, number> = {
  acetaminophen: 4 * 60 * 60 * 1000,
  ibuprofen: 6 * 60 * 60 * 1000,
};

const CROSS_DOSE_INTERVAL = 2 * 60 * 60 * 1000;
const STORAGE_KEY = "dose-timer-records";

const loadRecords = (): DoseRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const records: DoseRecord[] = JSON.parse(raw);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return records.filter((r) => r.timestamp > cutoff);
  } catch {
    return [];
  }
};

const saveRecords = (records: DoseRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const formatTimeLeft = (ms: number): string => {
  if (ms <= 0) return "지금 복용 가능";
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const s = Math.floor((ms % (60 * 1000)) / 1000);
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
};

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const h12 = h % 12 || 12;
  return `${period} ${h12}:${m}`;
};

const MEDICINE_INFO: Record<
  MedicineType,
  { label: string; icon: typeof Thermometer }
> = {
  acetaminophen: {
    label: "아세트아미노펜",
    icon: Thermometer,
  },
  ibuprofen: {
    label: "이부프로펜",
    icon: Droplets,
  },
};

const DoseTimerCard = () => {
  const [records, setRecords] = useState<DoseRecord[]>(loadRecords);
  const [now, setNow] = useState(Date.now());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    if (!notificationsEnabled || records.length === 0) return;
    const last = records[records.length - 1];
    const interval = INTERVALS[last.type];
    const nextTime = last.timestamp + interval;
    const delay = nextTime - Date.now();
    if (delay <= 0) return;

    const timeoutId = setTimeout(() => {
      new Notification("💊 해열제 복용 시간!", {
        body: `${MEDICINE_INFO[last.type].label} 복용 후 ${last.type === "acetaminophen" ? "4시간" : "6시간"}이 지났습니다. 다음 복용이 가능합니다.`,
        icon: "/favicon.png",
      });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [records, notificationsEnabled]);

  const handleRequestNotification = useCallback(async () => {
    if (!("Notification" in window)) {
      toast({ title: "이 브라우저는 알림을 지원하지 않습니다" });
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationsEnabled(perm === "granted");
    if (perm === "granted") {
      toast({ title: "알림이 활성화되었습니다" });
    }
  }, []);

  const recordDose = useCallback(
    (type: MedicineType) => {
      const newRecord: DoseRecord = { type, timestamp: Date.now() };
      const updated = [...records, newRecord];
      setRecords(updated);
      saveRecords(updated);
      const info = MEDICINE_INFO[type];
      toast({
        title: `${info.label} 복용 기록됨`,
        description: `${formatTime(newRecord.timestamp)}에 복용. 다음 복용: ${formatTime(newRecord.timestamp + INTERVALS[type])}`,
      });
    },
    [records]
  );

  const clearRecords = useCallback(() => {
    setRecords([]);
    localStorage.removeItem(STORAGE_KEY);
    toast({ title: "복용 기록이 초기화되었습니다" });
  }, []);

  const getStatus = (type: MedicineType) => {
    const lastOfType = [...records].reverse().find((r) => r.type === type);
    if (!lastOfType) return { canTake: true, timeLeft: 0, lastTime: null };
    const elapsed = now - lastOfType.timestamp;
    const interval = INTERVALS[type];
    const timeLeft = Math.max(0, interval - elapsed);
    return { canTake: timeLeft === 0, timeLeft, lastTime: lastOfType.timestamp };
  };

  const getCrossDoseRecommendation = () => {
    if (records.length === 0) return null;
    const last = records[records.length - 1];
    const elapsed = now - last.timestamp;
    const otherType: MedicineType = last.type === "acetaminophen" ? "ibuprofen" : "acetaminophen";
    const crossTimeLeft = Math.max(0, CROSS_DOSE_INTERVAL - elapsed);

    if (crossTimeLeft === 0 && elapsed < INTERVALS[last.type]) {
      return {
        recommend: true,
        otherType,
        message: `열이 안 내려가면 ${MEDICINE_INFO[otherType].label}으로 교차 복용 가능`,
      };
    }
    if (crossTimeLeft > 0) {
      return {
        recommend: false,
        otherType,
        message: `교차 복용까지 ${formatTimeLeft(crossTimeLeft)}`,
      };
    }
    return null;
  };

  const acetaStatus = getStatus("acetaminophen");
  const ibuStatus = getStatus("ibuprofen");
  const crossDose = getCrossDoseRecommendation();

  const getProgress = (type: MedicineType) => {
    const status = type === "acetaminophen" ? acetaStatus : ibuStatus;
    if (!status.lastTime) return 0;
    const interval = INTERVALS[type];
    const elapsed = now - status.lastTime;
    return Math.min(1, elapsed / interval);
  };

  return (
    <div className="bg-secondary rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <Clock className="w-4.5 h-4.5 text-foreground" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">복용 타이머</h3>
            <p className="text-[11px] text-muted-foreground">교차 복용 시간 관리</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={notificationsEnabled ? undefined : handleRequestNotification}
            className={`p-1.5 rounded-lg transition-colors ${
              notificationsEnabled
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:bg-muted"
            }`}
            title={notificationsEnabled ? "알림 활성화됨" : "알림 활성화"}
          >
            {notificationsEnabled ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>
          {records.length > 0 && (
            <button
              onClick={clearRecords}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              title="기록 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Record Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {(["acetaminophen", "ibuprofen"] as MedicineType[]).map((type) => {
          const info = MEDICINE_INFO[type];
          const status = type === "acetaminophen" ? acetaStatus : ibuStatus;
          const progress = getProgress(type);
          const Icon = info.icon;

          return (
            <button
              key={type}
              onClick={() => recordDose(type)}
              className={`relative overflow-hidden rounded-xl p-3.5 text-left transition-all ${
                status.canTake
                  ? "bg-background hover:shadow-md active:scale-[0.98]"
                  : "bg-muted/50 opacity-75"
              }`}
            >
              {!status.canTake && status.lastTime && (
                <motion.div
                  className="absolute inset-0 bg-muted opacity-40"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              )}
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold text-foreground">{info.label}</span>
                </div>
                {status.lastTime ? (
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      마지막: {formatTime(status.lastTime)}
                    </p>
                    <p
                      className={`text-xs font-bold mt-0.5 ${status.canTake ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {status.canTake ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" /> 복용 가능
                        </span>
                      ) : (
                        formatTimeLeft(status.timeLeft)
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-muted-foreground">지금 복용 기록</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Cross-dose recommendation */}
      <AnimatePresence>
        {crossDose && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-muted text-center">
              <p className="text-xs font-semibold text-foreground">
                {crossDose.recommend ? "✅ " : "⏳ "}
                {crossDose.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent History */}
      {records.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground">최근 기록</p>
          <div className="flex flex-wrap gap-1.5">
            {[...records]
              .reverse()
              .slice(0, 6)
              .map((record, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground"
                >
                  {record.type === "acetaminophen" ? "A" : "I"} {formatTime(record.timestamp)}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoseTimerCard;
