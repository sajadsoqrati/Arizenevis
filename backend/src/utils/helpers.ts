import { customAlphabet } from "nanoid";

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export function generateReferralCode(): string {
  return `MK-${generateCode()}`;
}

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, "")
    .slice(0, 80);
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING_PRICE: "در انتظار تعیین قیمت",
  PRICED: "قیمت‌گذاری شده",
  PAID: "پرداخت شده",
  ANSWERED: "پاسخ داده شده",
  PENDING: "در انتظار",
  SUCCESS: "موفق",
  FAILED: "ناموفق",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
};
