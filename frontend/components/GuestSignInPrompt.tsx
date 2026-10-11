"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function GuestSignInPrompt() {
  const { user, loading } = useAuth();

  if (loading || user) return null;

  return (
    <section className="text-center text-gray-500 text-sm">
      <p>
        برای ثبت درخواست باید{" "}
        <Link href="/login" className="text-primary-light underline">
          وارد
        </Link>{" "}
        حساب کاربری خود شوید یا{" "}
        <Link href="/register" className="text-primary-light underline">
          ثبت‌نام
        </Link>{" "}
        کنید.
      </p>
    </section>
  );
}
