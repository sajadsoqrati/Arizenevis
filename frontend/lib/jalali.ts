import { toGregorian, toJalaali, isValidJalaaliDate } from "jalaali-js";

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export interface JalaliDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function isoToJalaliParts(iso: string): JalaliDateTimeParts | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const { jy, jm, jd } = toJalaali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  return {
    year: jy,
    month: jm,
    day: jd,
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

export function jalaliPartsToIso(parts: JalaliDateTimeParts): string | null {
  const { year, month, day, hour, minute } = parts;
  if (!year || !month || !day) return null;
  if (!isValidJalaaliDate(year, month, day)) return null;

  const { gy, gm, gd } = toGregorian(year, month, day);
  return new Date(gy, gm - 1, gd, hour, minute, 0, 0).toISOString();
}

export function formatJalaliParts(parts: JalaliDateTimeParts): string {
  const monthName = JALALI_MONTHS[parts.month - 1] ?? "";
  const hour = String(parts.hour).padStart(2, "0");
  const minute = String(parts.minute).padStart(2, "0");
  return `${parts.day} ${monthName} ${parts.year} — ${hour}:${minute}`;
}
