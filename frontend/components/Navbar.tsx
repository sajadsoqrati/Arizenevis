"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { RiCloseLine, RiMenuLine } from "react-icons/ri";
import { useAuth } from "@/lib/auth";
import Image from "next/image";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, user?.id]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [menuOpen]);

  return (
    <nav
      ref={navRef}
      aria-label="منوی اصلی"
      className="bg-primary rounded-2xl text-white shadow-md m-3"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          setMenuOpen(false);
          toggleRef.current?.focus();
        }
      }}
      onClick={(event) => {
        if ((event.target as Element).closest("a")) setMenuOpen(false);
      }}
    >
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
          <span className=" sm:inline">عریضه نویس</span>
        </Link>

        <button
          ref={toggleRef}
          type="button"
          aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
          aria-expanded={menuOpen}
          aria-controls="navbar-links"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-white/30 text-2xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:hidden"
        >
          {menuOpen ? (
            <RiCloseLine aria-hidden="true" />
          ) : (
            <RiMenuLine aria-hidden="true" />
          )}
        </button>

        <div
          id="navbar-links"
          className={menuOpen ? "contents" : "hidden sm:contents"}
        >
          <div className="order-2 flex w-full flex-col items-stretch justify-center gap-2 border-t border-white/20 pt-3 pb-1 text-sm sm:order-3 sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:pt-0 lg:absolute lg:left-1/2 lg:top-1/2 lg:order-none lg:w-auto lg:-translate-x-1/2 lg:-translate-y-1/2 lg:pb-0">
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

          <div className="order-3 flex w-full flex-col items-stretch gap-2 pb-2 text-sm sm:order-none sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:pb-0 sm:text-base">
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
                <span className="text-gray-300">{user.fullName}</span>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="rounded-lg bg-4service-btn px-4 py-2 font-medium text-primary hover:opacity-90 sm:px-5"
                  >
                    پنل مدیر
                  </Link>
                )}
                {user.role === "MARKETER" && (
                  <Link
                    href="/marketer"
                    className="rounded-lg bg-4service-btn px-4 py-2 font-medium text-primary hover:opacity-90 sm:px-5"
                  >
                    پنل بازاریاب
                  </Link>
                )}
                {(user.role === "CUSTOMER" || user.role === "COWORKER") && (
                  <Link href="/dashboard" className="hover:underline">
                    داشبورد
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className=" rounded-lg bg-4service-btn px-4 py-2 font-medium text-primary hover:opacity-90 sm:px-5 hover:underline cursor-pointer"
                >
                  خروج
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
