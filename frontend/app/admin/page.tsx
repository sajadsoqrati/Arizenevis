"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import JalaliDateTimeInput from "@/components/JalaliDateTimeInput";
import { api, ApiError } from "@/lib/api";
import {
  HelpRequest,
  STATUS_LABELS,
  formatPrice,
  formatDate,
} from "@/lib/types";

type Tab = "requests" | "payments" | "marketers" | "budget" | "discount";

interface Payment {
  id: string;
  status: string;
  originalPrice: number;
  finalAmount: number;
  discountAmount: number;
  paidAt: string | null;
  helpRequest: HelpRequest & {
    user: { fullName: string; phone: string; nationalId: string };
  };
  commission?: {
    amount: number;
    rate: number;
    marketerProfile: { user: { fullName: string } };
  };
}

interface Marketer {
  id: string;
  referralCode: string;
  user: { fullName: string; phone: string; city: string };
  coworkers: { coworker: { fullName: string; phone: string } }[];
  commissions: { amount: number }[];
}

interface BudgetRequest {
  id: string;
  amount: number;
  description: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  marketerProfile: { user: { fullName: string; phone: string } };
}

interface DiscountCode {
  id: string;
  code: string;
  percentOff: number;
  usedCount: number;
  maxUses: number | null;
  isActive: boolean;
  firstTimeOnly: boolean;
}

const priceSchema = z.object({
  price: z.coerce.number().positive("قیمت باید مثبت باشد"),
  answerDeadline: z.string().datetime({ message: "تاریخ پاسخ‌دهی معتبر نیست" }),
});

const discountSchema = z.object({
  code: z.string().min(3),
  percentOff: z.coerce.number().min(1).max(100),
  maxUses: z.coerce.number().optional(),
  firstTimeOnly: z.boolean().optional(),
});

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [marketers, setMarketers] = useState<Marketer[]>([]);
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const priceForm = useForm({ resolver: zodResolver(priceSchema) });
  const discountForm = useForm({
    resolver: zodResolver(discountSchema),
    defaultValues: { firstTimeOnly: false },
  });

  const loadData = async () => {
    try {
      const [reqs, pays, mks, budgets, codes] = await Promise.all([
        api<HelpRequest[]>("/api/admin/requests"),
        api<Payment[]>("/api/admin/payments"),
        api<Marketer[]>("/api/admin/marketers"),
        api<BudgetRequest[]>("/api/admin/budget-requests"),
        api<DiscountCode[]>("/api/admin/discount-codes"),
      ]);
      setRequests(reqs);
      setPayments(pays);
      setMarketers(mks);
      setBudgetRequests(budgets);
      setDiscountCodes(codes);
    } catch {
      setMessage("خطا در بارگذاری داده‌ها");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setPrice = async (id: string, data: z.infer<typeof priceSchema>) => {
    try {
      await api(`/api/admin/requests/${id}/price`, {
        method: "PATCH",
        body: JSON.stringify({
          price: data.price,
          answerDeadline: data.answerDeadline,
        }),
      });
      setMessage("قیمت و زمان انجام ثبت شد");
      setSelectedRequest(null);
      loadData();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "خطا");
    }
  };

  const markAnswered = async (id: string) => {
    await api(`/api/admin/requests/${id}/answered`, { method: "PATCH" });
    loadData();
  };

  const handleBudget = async (id: string, status: "APPROVED" | "REJECTED") => {
    await api(`/api/admin/budget-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    loadData();
  };

  const createDiscount = async (data: z.infer<typeof discountSchema>) => {
    await api("/api/admin/discount-codes", {
      method: "POST",
      body: JSON.stringify(data),
    });
    discountForm.reset();
    loadData();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "requests", label: "درخواست‌ها" },
    { key: "payments", label: "پرداخت‌ها" },
    { key: "marketers", label: "بازاریاب‌ها" },
    { key: "budget", label: "بودجه" },
    // { key: "discount", label: "تخفیف" },
  ];

  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">پنل مدیریت</h1>
          <Link href="/admin/weblog" className="btn-secondary text-sm">
            مدیریت وبلاگ
          </Link>
        </div>

        {message && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-sm">
            {message}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b pb-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                tab === t.key
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "requests" && (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="card space-y-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-bold text-xl">
                    {req.category?.title}
                  </span>
                  <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  نام کاربری : {req.user?.fullName}
                  <br />
                  شماره ملی : {req.user?.nationalId}
                  <br />
                  شماره تماس : {req.user?.phone}
                </p>
                <p className="whitespace-pre-wrap ">
                  <span className="text-sm text-gray-500 ">متن درخواست‌ :</span>{" "}
                  <br />
                  {req.question}
                </p>
                <br />
                {req.price && <p>قیمت: {formatPrice(req.price)}</p>}
                {req.answerDeadline && (
                  <p className="text-sm">
                    زمان انجام: {formatDate(req.answerDeadline)}
                  </p>
                )}

                {req.status === "PENDING_PRICE" && (
                  <div>
                    {selectedRequest === req.id ? (
                      <form
                        onSubmit={priceForm.handleSubmit((d) =>
                          setPrice(req.id, d),
                        )}
                        className="grid sm:grid-cols-2 gap-3 mt-2"
                      >
                        <Controller
                          name="price"
                          control={priceForm.control}
                          render={({ field, fieldState }) => (
                            <div>
                              <input
                                {...field}
                                type="text"
                                inputMode="numeric"
                                dir="ltr"
                                aria-label="قیمت (ریال)"
                                aria-invalid={!!fieldState.error}
                                aria-describedby={
                                  fieldState.error ? "price-error" : undefined
                                }
                                placeholder="قیمت (ریال)"
                                className="input-field"
                                value={String(field.value ?? "").replace(
                                  /\B(?=(\d{3})+(?!\d))/g,
                                  ",",
                                )}
                                onChange={(event) => {
                                  const digits = event.target.value
                                    .replace(/[۰-۹]/g, (digit) =>
                                      String(digit.charCodeAt(0) - 1776),
                                    )
                                    .replace(/[٠-٩]/g, (digit) =>
                                      String(digit.charCodeAt(0) - 1632),
                                    )
                                    .replace(/[,٬\s]/g, "");
                                  if (/^\d*$/.test(digits))
                                    field.onChange(digits);
                                }}
                              />
                              {fieldState.error && (
                                <p
                                  id="price-error"
                                  className="mt-1 text-sm text-red-600"
                                >
                                  {fieldState.error.message}
                                </p>
                              )}
                            </div>
                          )}
                        />
                        <div className="sm:col-span-2">
                          <Controller
                            name="answerDeadline"
                            control={priceForm.control}
                            render={({ field }) => (
                              <JalaliDateTimeInput
                                value={field.value}
                                onChange={field.onChange}
                                error={
                                  priceForm.formState.errors.answerDeadline
                                    ?.message
                                }
                              />
                            )}
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn-primary sm:col-span-2"
                        >
                          ثبت قیمت و زمان انجام
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedRequest(req.id);
                          const defaultDeadline = new Date(
                            Date.now() + 7 * 24 * 60 * 60 * 1000,
                          ).toISOString();
                          priceForm.reset({ answerDeadline: defaultDeadline });
                        }}
                        className="btn-primary text-sm"
                      >
                        تعیین قیمت
                      </button>
                    )}
                  </div>
                )}

                {req.status === "PAID" && (
                  <button
                    onClick={() => markAnswered(req.id)}
                    className="btn-secondary text-sm"
                  >
                    علامت‌گذاری به عنوان پاسخ داده شده
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "payments" && (
          <div className="space-y-4">
            {payments.map((pay) => (
              <div key={pay.id} className="card space-y-2">
                <div className="flex justify-between">
                  <span>{STATUS_LABELS[pay.status]}</span>
                  <span>{formatPrice(pay.finalAmount)}</span>
                </div>
                <p className="text-sm">
                  {pay.helpRequest.user.fullName} — {pay.helpRequest.user.phone}
                </p>
                <p className="text-sm text-gray-500">
                  قیمت اصلی: {formatPrice(pay.originalPrice)}
                  {pay.discountAmount > 0 &&
                    ` | تخفیف: ${formatPrice(pay.discountAmount)}`}
                </p>
                {pay.commission && (
                  <p className="text-sm text-amber-700">
                    کمیسیون بازاریاب (
                    {pay.commission.marketerProfile.user.fullName}):{" "}
                    {formatPrice(pay.commission.amount)} (
                    {Math.round(pay.commission.rate * 100)}%)
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "marketers" && (
          <div className="space-y-4">
            {marketers.map((m) => (
              <div key={m.id} className="card">
                <h3 className="font-bold">{m.user.fullName}</h3>
                <p className="text-sm text-gray-500">
                  کد معرف: {m.referralCode}
                </p>
                <p className="text-sm">
                  {m.user.phone} — {m.user.city}
                </p>
                <p className="text-sm mt-2">
                  معرفی‌شدگان: {m.coworkers.length} | کل کمیسیون:{" "}
                  {formatPrice(m.commissions.reduce((s, c) => s + c.amount, 0))}
                </p>
                {m.coworkers.length > 0 && (
                  <ul className="text-sm text-gray-600 mt-2 list-disc mr-5">
                    {m.coworkers.map((c) => (
                      <li key={c.coworker.fullName}>
                        {c.coworker.fullName} — {c.coworker.phone}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "budget" && (
          <div className="space-y-4">
            {budgetRequests.map((b) => (
              <div key={b.id} className="card space-y-2">
                <div className="flex justify-between">
                  <span>{b.marketerProfile.user.fullName}</span>
                  <span>{STATUS_LABELS[b.status]}</span>
                </div>
                <p>{formatPrice(b.amount)}</p>
                <p className="text-sm">{b.description}</p>
                {b.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBudget(b.id, "APPROVED")}
                      className="btn-primary text-sm"
                    >
                      تأیید
                    </button>
                    <button
                      onClick={() => handleBudget(b.id, "REJECTED")}
                      className="btn-secondary text-sm"
                    >
                      رد
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Temporarily hidden; keep this panel for later re-enabling. */}
        {/* {tab === "discount" && (
          <div className="space-y-6">
            <form
              onSubmit={discountForm.handleSubmit(createDiscount)}
              className="card grid sm:grid-cols-2 gap-3"
            >
              <input
                placeholder="کد"
                {...discountForm.register("code")}
                className="input-field"
                dir="ltr"
              />
              <input
                type="number"
                placeholder="درصد تخفیف"
                {...discountForm.register("percentOff")}
                className="input-field"
              />
              <input
                type="number"
                placeholder="حداکثر استفاده"
                {...discountForm.register("maxUses")}
                className="input-field"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...discountForm.register("firstTimeOnly")}
                />
                فقط اولین خرید
              </label>
              <button type="submit" className="btn-primary sm:col-span-2">
                ایجاد کد تخفیف
              </button>
            </form>

            {discountCodes.map((c) => (
              <div
                key={c.id}
                className="card flex justify-between items-center"
              >
                <div>
                  <span className="font-bold" dir="ltr">
                    {c.code}
                  </span>
                  <span className="text-sm text-gray-500 mr-3">
                    {c.percentOff}%
                  </span>
                  <span className="text-xs text-gray-400">
                    استفاده: {c.usedCount}
                    {c.maxUses ? `/${c.maxUses}` : ""}
                  </span>
                </div>
                <span
                  className={`text-sm ${c.isActive ? "text-green-600" : "text-red-500"}`}
                >
                  {c.isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>
            ))}
          </div>
        )} */}
      </div>
    </ProtectedRoute>
  );
}
