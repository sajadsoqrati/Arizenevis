"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/types";
import Image from "next/image";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-20">
        <Link
          href="/"
          className="xs:text-xl sm:text-2xl font-extrabold hover:opacity-90 flex items-center gap-2"
        >
          <Image
            src="/logo.svg"
            alt="logo"
            width={40}
            height={40}
            className="w-15 h-15 m-2"
          />
          عریضه نویس
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/weblog"
            className="bg-background text-primary px-4 py-1.5 rounded-lg font-medium hover:opacity-90"
          >
            وبلاگ
          </Link>

          {!loading && !user && (
            <>
              <Link
                href="/login"
                className="bg-background text-primary px-4 py-1.5 rounded-lg font-medium hover:opacity-90"
              >
                ورود
              </Link>
              <Link
                href="/register"
                className="bg-4service-btn text-primary px-4 py-1.5 rounded-lg font-medium hover:opacity-90"
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
