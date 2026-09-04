export type Role = "CUSTOMER" | "COWORKER" | "MARKETER" | "ADMIN";

export interface User {
  id: string;
  fullName: string;
  nationalId: string;
  role: Role;
  phone?: string;
  city?: string;
  province?: string;
  jobTitle?: string;
  marketerProfile?: { referralCode: string };
}

export interface ServiceCategory {
  id: string;
  slug: string;
  title: string;
}

export interface HelpRequest {
  id: string;
  question: string;
  price: number | null;
  answerDeadline: string | null;
  status: "PENDING_PRICE" | "PRICED" | "PAID" | "ANSWERED";
  interactionNumber: number | null;
  createdAt: string;
  category: ServiceCategory;
  user?: {
    fullName: string;
    phone: string;
    nationalId: string;
    city?: string;
    province?: string;
    role?: Role;
  };
  payment?: {
    id: string;
    status: string;
    finalAmount: number;
    originalPrice: number;
    discountAmount: number;
  } | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  createdAt: string;
  author: { fullName: string };
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

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "شخص حقیقی",
  COWORKER: "همکار",
  MARKETER: "بازاریاب",
  ADMIN: "مدیر",
};

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
