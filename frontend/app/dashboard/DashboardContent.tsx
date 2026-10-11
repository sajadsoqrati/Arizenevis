"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, ApiError } from "@/lib/api";
import {
  HelpRequest,
  STATUS_LABELS,
  formatPrice,
  formatDate,
} from "@/lib/types";

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [message, setMessage] = useState("");

  const paymentStatus = searchParams.get("payment");
  const paidFree = searchParams.get("paid");

  useEffect(() => {
    if (paymentStatus === "success" || paidFree === "true") {
      setMessage("پرداخت با موفقیت انجام شد!");
    } else if (paymentStatus === "failed") {
      setMessage("پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.");
    }
  }, [paymentStatus, paidFree]);

  useEffect(() => {
    api<HelpRequest[]>("/api/requests/mine")
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async (requestId: string) => {
    setPayingId(requestId);
    setMessage("");
    try {
      const data = await api<{
        gatewayUrl?: string;
        freeCheckout?: boolean;
        redirectUrl?: string;
      }>(`/api/payments/initiate/${requestId}`, {
        method: "POST",
        body: JSON.stringify({
          discountCode: discountCode.trim() || undefined,
        }),
      });

      if (data.freeCheckout && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      }
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "خطا در پرداخت");
      setPayingId(null);
    }
  };

  return (
    <ProtectedRoute roles={["CUSTOMER", "COWORKER"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">درخواست‌های من</h1>
          <Link href="/" className="btn-secondary text-sm">
            درخواست جدید
          </Link>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-sm ${
              message.includes("موفق")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {loading && <p className="text-gray-500">در حال بارگذاری...</p>}

        {!loading && requests.length === 0 && (
          <div className="card text-center text-gray-500">
            <p>هنوز درخواستی ثبت نکرده‌اید.</p>
            <Link
              href="/"
              className="text-primary-light underline mt-2 inline-block"
            >
              ثبت درخواست جدید
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-primary">
                  {req.category.title}
                </span>
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                  {STATUS_LABELS[req.status]}
                </span>
              </div>

              <p className="text-gray-700 whitespace-pre-wrap">
                {req.question}
              </p>

              <p className="text-xs text-gray-400">
                ثبت شده: {formatDate(req.createdAt)}
              </p>

              {req.price !== null && (
                <p className="font-medium">قیمت: {formatPrice(req.price)}</p>
              )}

              {req.answerDeadline && (
                <p className="text-sm text-blue-700">
                  زمان پاسخ‌دهی: {formatDate(req.answerDeadline)}
                </p>
              )}

              {req.status === "PRICED" && (
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">
                      کد تخفیف (اختیاری)
                    </label>
                    <input
                      value={discountCode}
                      onChange={(e) =>
                        setDiscountCode(e.target.value.toUpperCase())
                      }
                      className="input-field mt-1"
                      dir="ltr"
                    />
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => handlePay(req.id)}
                      disabled={payingId === req.id}
                      className="btn-primary "
                    >
                      {payingId === req.id ? "در حال انتقال..." : "پرداخت"}
                    </button>
                  </div>
                </div>
              )}

              {req.payment?.status === "SUCCESS" && (
                <p className="text-green-600 text-sm font-medium">
                  پرداخت شده — {formatPrice(req.payment.finalAmount)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
