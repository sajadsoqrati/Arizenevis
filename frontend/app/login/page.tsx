"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

const loginSchema = z.object({
  nationalId: z.string().min(5, "شماره ملی یا شماره ثبت شرکت الزامی است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError("");
    setLoading(true);
    try {
      await login(data.nationalId, data.password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در ورود");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-bold text-center mb-6">ورود به حساب</h1>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            شماره ملی / شماره ثبت شرکت
          </label>
          <input {...register("nationalId")} className="input-field" dir="ltr" />
          {errors.nationalId && (
            <p className="text-red-500 text-sm mt-1">{errors.nationalId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">رمز عبور</label>
          <input
            type="password"
            {...register("password")}
            className="input-field"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "در حال ورود..." : "ورود"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        حساب ندارید؟{" "}
        <Link href="/register" className="text-primary-light underline">
          ثبت‌نام
        </Link>
      </p>
    </div>
  );
}
