"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/types";
import Image from "next/image";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="bg-primary rounded-2xl text-white shadow-md m-3">
      <div className="container relative mx-auto flex min-h-20 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 lg:flex-nowrap">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-extrabold hover:opacity-90 sm:text-2xl"
        >
          <Image
            src="/logo.svg"
            alt="logo"
            width={40}
            height={40}
            className="m-1 h-12 w-12 sm:h-14 sm:w-14"
          />
          <span className="hidden sm:inline">عریضه نویس</span>
        </Link>

        <div className="order-3 flex w-full items-center justify-center gap-2 pb-1 text-xs sm:gap-3 sm:text-sm lg:absolute lg:left-1/2 lg:top-1/2 lg:order-none lg:w-auto lg:-translate-x-1/2 lg:-translate-y-1/2 lg:pb-0">
          <Link
            href="/about"
            className="whitespace-nowrap rounded-lg bg-background px-3 py-1.5 font-medium text-primary transition-opacity hover:opacity-90 sm:px-4"
          >
            درباره ما
          </Link>

          <Link
            href="/contact"
            className="whitespace-nowrap rounded-lg bg-background px-3 py-1.5 font-medium text-primary transition-opacity hover:opacity-90 sm:px-4"
          >
            تماس با ما
          </Link>

          <Link
            href="/weblog"
            className="whitespace-nowrap rounded-lg bg-background px-3 py-1.5 font-medium text-primary transition-opacity hover:opacity-90 sm:px-4"
          >
            وبلاگ
          </Link>
        </div>

        <div className="flex items-center gap-2 text-sm sm:gap-4 sm:text-base">
          {!loading && !user && (
            <>
              <Link
                href="/login"
                className="rounded-lg bg-background px-4 py-2 font-medium text-primary hover:opacity-90 sm:px-5"
              >
                ورود
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-4service-btn px-4 py-2 font-medium text-primary hover:opacity-90 sm:px-5"
              >
                ثبت‌نام
              </Link>
            </>
          )}

          {!loading && user && (
            <>
              <span className="text-gray-300 hidden sm:inline">
                {user.fullName} ({ROLE_LABELS[user.role]})
              </span>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="hover:underline">
                  پنل مدیر
                </Link>
              )}
              {user.role === "MARKETER" && (
                <Link href="/marketer" className="hover:underline">
                  پنل بازاریاب
                </Link>
              )}
              {(user.role === "CUSTOMER" || user.role === "COWORKER") && (
                <Link href="/dashboard" className="hover:underline">
                  داشبورد
                </Link>
              )}
              <button
                onClick={() => logout()}
                className="hover:underline cursor-pointer"
              >
                خروج
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
