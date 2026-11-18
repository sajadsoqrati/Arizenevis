"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const CATEGORY_TITLES: Record<string, string> = {
  ezharnameh: "اظهارنامه",
  gharardad: "قراردادنویسی",
  moshavareh: "مشاوره",
  layeheh: "لایحه",
};

const schema = z.object({
  question: z.string().min(10, "متن درخواست باید حداقل ۱۰ کاراکتر باشد"),
});

type FormData = z.infer<typeof schema>;

export default function ServicePage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/services/${slug}`);
    }
  }, [user, authLoading, router, slug]);

  const onSubmit = async (data: FormData) => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          categorySlug: slug,
          question: data.question,
        }),
      });
      setSuccess("درخواست شما ثبت شد. پس از تعیین قیمت مطلع خواهید شد.");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در ثبت درخواست");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <ProtectedRoute roles={["CUSTOMER", "COWORKER"]}>
      <div className="max-w-3xl mx-auto card">
        <h1 className="text-2xl font-bold mb-2">
          {CATEGORY_TITLES[slug] || "درخواست خدمات"}
        </h1>
        <p className="text-gray-500 mb-6">
          متن درخواست یا سوال خود را در کادر زیر بنویسید.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-xl mb-4 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <textarea
            {...register("question")}
            rows={12}
            className="input-field resize-none text-base leading-relaxed"
            placeholder="درخواست خود را اینجا بنویسید..."
          />
          {errors.question && (
            <p className="text-red-500 text-sm">{errors.question.message}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "در حال ارسال..." : "ارسال درخواست"}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}
