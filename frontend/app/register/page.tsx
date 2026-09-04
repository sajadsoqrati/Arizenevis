"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import ProvinceCityFields from "@/components/ProvinceCityFields";

const registerSchema = z
  .object({
    fullName: z.string().min(3, "نام و نام خانوادگی الزامی است"),
    nationalId: z.string().min(5, "شماره ملی یا شماره ثبت شرکت الزامی است"),
    jobTitle: z.string().min(2, "شغل الزامی است"),
    role: z.enum(["CUSTOMER", "COWORKER", "MARKETER"], {
      required_error: "نقش کاربر الزامی است",
    }),
    password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
    confirmPassword: z.string(),
    phone: z.string().min(10, "شماره تماس معتبر نیست"),
    city: z.string().min(2, "شهر الزامی است"),
    province: z.string().min(2, "استان الزامی است"),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیست",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "CUSTOMER" },
  });

  const selectedRole = watch("role");
  const watchProvince = watch("province") || "";
  const watchCity = watch("city") || "";

  const onSubmit = async (data: RegisterForm) => {
    setError("");
    setLoading(true);
    try {
      await registerUser({
        fullName: data.fullName,
        nationalId: data.nationalId,
        jobTitle: data.jobTitle,
        role: data.role,
        password: data.password,
        phone: data.phone,
        city: data.city.trim(),
        province: data.province.trim(),
        referralCode:
          data.role === "COWORKER"
            ? data.referralCode?.trim() || undefined
            : undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-2xl font-bold text-center mb-6">ثبت‌نام</h1>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            نام و نام خانوادگی
          </label>
          <input {...register("fullName")} className="input-field" />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            شماره ملی / شماره ثبت شرکت
          </label>
          <input
            {...register("nationalId")}
            className="input-field"
            dir="ltr"
          />
          {errors.nationalId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.nationalId.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">شغل</label>
          <input {...register("jobTitle")} className="input-field" />
          {errors.jobTitle && (
            <p className="text-red-500 text-sm mt-1">
              {errors.jobTitle.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">نقش کاربر</label>
          <select {...register("role")} className="input-field">
            <option value="CUSTOMER">شخص حقیقی</option>
            <option value="COWORKER">همکار</option>
            <option value="MARKETER">بازاریاب</option>
          </select>
          {errors.role && (
            <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
          )}
        </div>

        {selectedRole === "COWORKER" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              کد معرف بازاریاب{" "}
              <span className="text-gray-400 font-normal">(اختیاری)</span>
            </label>
            <input
              {...register("referralCode")}
              className="input-field"
              dir="ltr"
              placeholder="MK-XXXXXX"
            />
            {errors.referralCode && (
              <p className="text-red-500 text-sm mt-1">
                {errors.referralCode.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">شماره تماس</label>
          <input {...register("phone")} className="input-field" dir="ltr" />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        <ProvinceCityFields
          register={register}
          setValue={setValue}
          watchProvince={watchProvince}
          watchCity={watchCity}
          errors={errors}
        />

        <div>
          <label className="block text-sm font-medium mb-1">رمز عبور</label>
          <input
            type="password"
            {...register("password")}
            className="input-field"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            تکرار رمز عبور
          </label>
          <input
            type="password"
            {...register("confirmPassword")}
            className="input-field"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link href="/login" className="text-primary-light underline">
          ورود
        </Link>
      </p>
    </div>
  );
}
