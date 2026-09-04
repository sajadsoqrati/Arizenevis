"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, ApiError } from "@/lib/api";
import { formatPrice, formatDate, STATUS_LABELS } from "@/lib/types";

interface MarketerProfile {
  referralCode: string;
  user: { fullName: string; phone: string; city: string; province: string };
  coworkers: {
    coworker: {
      id: string;
      fullName: string;
      phone: string;
      city: string;
      createdAt: string;
    };
  }[];
  budgetRequests: {
    id: string;
    amount: number;
    description: string;
    status: string;
    createdAt: string;
  }[];
  commissions: {
    amount: number;
    rate: number;
    interactionNumber: number;
    createdAt: string;
    payment: {
      helpRequest: { category: { title: string } };
    };
  }[];
  totalCommission: number;
}

const budgetSchema = z.object({
  amount: z.coerce.number().positive("مبلغ باید مثبت باشد"),
  description: z.string().min(5, "توضیحات الزامی است"),
});

export default function MarketerPage() {
  const [profile, setProfile] = useState<MarketerProfile | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const form = useForm({
    resolver: zodResolver(budgetSchema),
  });

  const loadProfile = () => {
    api<MarketerProfile>("/api/marketer/profile")
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onSubmit = async (data: z.infer<typeof budgetSchema>) => {
    try {
      await api("/api/marketer/budget-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setMessage("درخواست بودجه ثبت شد");
      form.reset();
      loadProfile();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "خطا");
    }
  };

  if (loading) {
    return <p className="text-gray-500">در حال بارگذاری...</p>;
  }

  return (
    <ProtectedRoute roles={["MARKETER"]}>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">پنل بازاریاب</h1>

        {profile && (
          <>
            <div className="card space-y-2">
              <h2 className="font-bold text-lg">{profile.user.fullName}</h2>
              <p className="text-sm text-gray-500">
                {profile.user.phone} — {profile.user.city}، {profile.user.province}
              </p>
              <p className="text-primary font-medium">
                کد معرف شما:{" "}
                <span dir="ltr" className="bg-gray-100 px-3 py-1 rounded-lg">
                  {profile.referralCode}
                </span>
              </p>
              <p className="text-sm">
                کل کمیسیون: {formatPrice(profile.totalCommission)}
              </p>
            </div>

            <section className="space-y-4">
              <h2 className="font-bold">همکاران ({profile.coworkers.length})</h2>
              {profile.coworkers.length === 0 && (
                <p className="text-gray-500 text-sm">هنوز همکاری ثبت نشده است.</p>
              )}
              {profile.coworkers.map((c) => (
                <div key={c.coworker.id} className="card">
                  <p className="font-medium">{c.coworker.fullName}</p>
                  <p className="text-sm text-gray-500">
                    {c.coworker.phone} — {c.coworker.city}
                  </p>
                  <p className="text-xs text-gray-400">
                    تاریخ عضویت: {formatDate(c.coworker.createdAt)}
                  </p>
                </div>
              ))}
            </section>

            <section className="card space-y-4">
              <h2 className="font-bold">درخواست بودجه</h2>
              {message && (
                <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm">
                  {message}
                </div>
              )}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <input
                  type="number"
                  placeholder="مبلغ (ریال)"
                  {...form.register("amount")}
                  className="input-field"
                />
                <textarea
                  placeholder="توضیحات"
                  rows={3}
                  {...form.register("description")}
                  className="input-field resize-none"
                />
                <button type="submit" className="btn-primary">
                  ارسال درخواست بودجه
                </button>
              </form>

              {profile.budgetRequests.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-600">درخواست‌های قبلی</h3>
                  {profile.budgetRequests.map((b) => (
                    <div key={b.id} className="text-sm flex justify-between">
                      <span>{formatPrice(b.amount)} — {b.description.slice(0, 40)}</span>
                      <span>{STATUS_LABELS[b.status]}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {profile.commissions.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-bold">کمیسیون‌ها</h2>
                {profile.commissions.map((c, i) => (
                  <div key={i} className="card text-sm flex justify-between">
                    <span>
                      {c.payment.helpRequest.category.title} — تعامل {c.interactionNumber}
                    </span>
                    <span>{formatPrice(c.amount)} ({Math.round(c.rate * 100)}%)</span>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
