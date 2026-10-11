"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import ProvinceCityFields from "@/components/ProvinceCityFields";
import { FiEye, FiEyeOff } from "react-icons/fi";

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
    acceptedTerms: z.boolean().refine((value) => value, {
      message: "برای ثبت‌نام باید قوانین و مقررات سایت را بپذیرید",
    }),
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
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "CUSTOMER", acceptedTerms: false },
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
          data.role === "CUSTOMER" || data.role === "COWORKER"
            ? data.referralCode?.trim() || undefined
            : undefined,
        acceptedTerms: data.acceptedTerms,
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

        {(selectedRole === "CUSTOMER" || selectedRole === "COWORKER") && (
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
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            رمز عبور
          </label>
          <div className="flex justify-between gap-2 input-field ">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="w-full focus:outline-none"
            />{" "}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className=" text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {" "}
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
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
          <div className="flex justify-between gap-2 input-field ">
            <input
              type={showPassword ? "text" : "password"}
              {...register("confirmPassword")}
              className="w-full focus:outline-none"
            />{" "}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className=" text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {" "}
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("acceptedTerms")}
              className="mt-1 h-4 w-4 shrink-0 accent-primary cursor-pointer"
              aria-invalid={errors.acceptedTerms ? "true" : "false"}
            />
            <span className="text-sm leading-6 text-gray-700">
              تأیید می‌کنم که{" "}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-light underline underline-offset-2"
              >
                قوانین و مقررات
              </Link>{" "}
              را مطالعه کرده‌ام و می‌پذیرم.
            </span>
          </label>
          {errors.acceptedTerms && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {errors.acceptedTerms.message}
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
