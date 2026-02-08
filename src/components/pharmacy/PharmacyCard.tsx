import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Clock, Navigation, Moon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NearbyPharmacy } from "@/hooks/useNearbyPharmacies";

const formatTime = (time?: string): string => {
  if (!time || time.length < 4) return "-";
  return `${time.slice(0, 2)}:${time.slice(2)}`;
};

const formatDistance = (km?: number): string => {
  if (!km) return "";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일", "공휴일"] as const;

type DutyTimeKey = `dutyTime${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}${"s" | "c"}`;

const getDaySchedule = (pharmacy: NearbyPharmacy) => {
  const schedule: { label: string; open?: string; close?: string }[] = [];
  for (let i = 1; i <= 8; i++) {
    const openKey = `dutyTime${i}s` as DutyTimeKey;
    const closeKey = `dutyTime${i}c` as DutyTimeKey;
    schedule.push({
      label: DAY_LABELS[i - 1],
      open: pharmacy[openKey] as string | undefined,
      close: pharmacy[closeKey] as string | undefined,
    });
  }
  return schedule;
};

const getTodayIndex = (): number => {
  const day = new Date().getDay();
  // getDay: 0=Sun → index 6, 1=Mon → 0, ...
  return day === 0 ? 6 : day - 1;
};

interface PharmacyCardProps {
  pharmacy: NearbyPharmacy;
  index: number;
  onSelect?: (pharmacy: NearbyPharmacy) => void;
  onCall: (phone: string) => void;
  onNavigate: (pharmacy: NearbyPharmacy) => void;
}

const PharmacyCard = ({ pharmacy, index, onSelect, onCall, onNavigate }: PharmacyCardProps) => {
  const [showWeekly, setShowWeekly] = useState(false);
  const todayIdx = getTodayIndex();
  const schedule = getDaySchedule(pharmacy);

  return (
    <motion.div
      key={pharmacy.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-4 rounded-xl border ${
        pharmacy.isOpen
          ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-100 dark:border-green-900/40"
          : "bg-muted/30 border-border"
      }`}
      onClick={() => onSelect?.(pharmacy)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          {/* Name + Badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-lg">💊</span>
            <h4
              className={`font-bold truncate ${
                pharmacy.isOpen ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {pharmacy.name}
            </h4>
            {pharmacy.isOpen ? (
              <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">영업중</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0">
                영업종료
              </Badge>
            )}
            {pharmacy.isNightPharmacy && (
              <Badge
                variant="outline"
                className="border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-[10px] px-1.5 py-0"
              >
                <Moon className="w-3 h-3 mr-0.5" />
                심야
              </Badge>
            )}
            {pharmacy.is24h && (
              <Badge
                variant="outline"
                className="border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0"
              >
                24h
              </Badge>
            )}
          </div>

          {/* Today hours + toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowWeekly((v) => !v);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground mb-1 hover:text-foreground transition-colors group"
          >
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>
              오늘{" "}
              {pharmacy.todayOpenTime && pharmacy.todayCloseTime
                ? `${formatTime(pharmacy.todayOpenTime)} ~ ${formatTime(pharmacy.todayCloseTime)}`
                : "영업시간 미확인"}
            </span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                showWeekly ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Weekly schedule (collapsible) */}
          <AnimatePresence>
            {showWeekly && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="overflow-hidden"
              >
                <div className="mt-1 mb-2 p-2.5 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-border/50">
                  <div className="grid grid-cols-1 gap-0.5">
                    {schedule.map((day, idx) => {
                      const isToday = idx === todayIdx;
                      const hasHours = day.open && day.close;
                      return (
                        <div
                          key={day.label}
                          className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                            isToday
                              ? "bg-green-100 dark:bg-green-900/40 font-semibold text-green-700 dark:text-green-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span className="w-10">{day.label}</span>
                          <span>
                            {hasHours
                              ? `${formatTime(day.open)} ~ ${formatTime(day.close)}`
                              : "휴무"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Address */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{pharmacy.address || "주소 정보 없음"}</span>
          </div>

          {/* Distance */}
          <div className="flex items-center gap-3 text-sm">
            {pharmacy.distance !== undefined && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                <Navigation className="w-3.5 h-3.5" />
                {formatDistance(pharmacy.distance)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {pharmacy.phone && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCall(pharmacy.phone);
            }}
            className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
          >
            <Phone className="w-4 h-4 mr-1" />
            전화
          </Button>
        )}
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(pharmacy);
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Navigation className="w-4 h-4 mr-1" />
          길찾기
        </Button>
      </div>
    </motion.div>
  );
};

export default PharmacyCard;
