/**
 * 한국 법정 공휴일 목록 (2025~2026)
 * 설날/추석 연휴는 별도 배열로 관리
 */

interface HolidayEntry {
  date: string; // YYYY-MM-DD
  name: string;
  isLunarHoliday?: boolean; // 설날/추석 연휴 여부
}

const holidays2025: HolidayEntry[] = [
  { date: '2025-01-01', name: '신정' },
  { date: '2025-01-28', name: '설날 연휴', isLunarHoliday: true },
  { date: '2025-01-29', name: '설날', isLunarHoliday: true },
  { date: '2025-01-30', name: '설날 연휴', isLunarHoliday: true },
  { date: '2025-03-01', name: '삼일절' },
  { date: '2025-05-05', name: '어린이날' },
  { date: '2025-05-06', name: '부처님오신날' },
  { date: '2025-06-06', name: '현충일' },
  { date: '2025-08-15', name: '광복절' },
  { date: '2025-10-03', name: '개천절' },
  { date: '2025-10-05', name: '추석 연휴', isLunarHoliday: true },
  { date: '2025-10-06', name: '추석', isLunarHoliday: true },
  { date: '2025-10-07', name: '추석 연휴', isLunarHoliday: true },
  { date: '2025-10-08', name: '추석 대체공휴일', isLunarHoliday: true },
  { date: '2025-10-09', name: '한글날' },
  { date: '2025-12-25', name: '크리스마스' },
];

const holidays2026: HolidayEntry[] = [
  { date: '2026-01-01', name: '신정' },
  { date: '2026-02-16', name: '설날 연휴', isLunarHoliday: true },
  { date: '2026-02-17', name: '설날', isLunarHoliday: true },
  { date: '2026-02-18', name: '설날 연휴', isLunarHoliday: true },
  { date: '2026-03-01', name: '삼일절' },
  { date: '2026-03-02', name: '삼일절 대체공휴일' },
  { date: '2026-05-05', name: '어린이날' },
  { date: '2026-05-24', name: '부처님오신날' },
  { date: '2026-06-06', name: '현충일' },
  { date: '2026-08-15', name: '광복절' },
  { date: '2026-09-24', name: '추석 연휴', isLunarHoliday: true },
  { date: '2026-09-25', name: '추석', isLunarHoliday: true },
  { date: '2026-09-26', name: '추석 연휴', isLunarHoliday: true },
  { date: '2026-10-03', name: '개천절' },
  { date: '2026-10-09', name: '한글날' },
  { date: '2026-12-25', name: '크리스마스' },
];

const allHolidays = [...holidays2025, ...holidays2026];

const holidayMap = new Map(allHolidays.map(h => [h.date, h]));

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isKoreanHoliday(date: Date): boolean {
  return holidayMap.has(formatDate(date));
}

export function isLunarHoliday(date: Date): boolean {
  const entry = holidayMap.get(formatDate(date));
  return entry?.isLunarHoliday === true;
}

export function getHolidayName(date: Date): string | null {
  return holidayMap.get(formatDate(date))?.name ?? null;
}
