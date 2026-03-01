import { isKoreanHoliday, isLunarHoliday } from './holidays';

/**
 * 응급실 시간대 패턴 가중치
 * 높을수록 혼잡 → 수용 확률 감소
 */
export function getTimePatternMultiplier(date: Date): number {
  const hour = date.getHours();
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // 설날/추석 연휴
  if (isLunarHoliday(date)) return 1.8;

  // 법정 공휴일
  if (isKoreanHoliday(date)) return 1.5;

  // 일요일 전일
  if (day === 0) return 1.4;

  // 금~일 22~02시 (야간 주말)
  const isFriSatSun = day === 5 || day === 6 || day === 0;
  if (isFriSatSun && (hour >= 22 || hour < 2)) return 1.6;

  // 평일 패턴
  const isWeekday = day >= 1 && day <= 5;
  if (isWeekday) {
    if (hour >= 8 && hour < 10) return 1.3;
    if (hour >= 12 && hour < 13) return 1.1;
  }

  return 1.0;
}
