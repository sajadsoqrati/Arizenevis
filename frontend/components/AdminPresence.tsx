"use client";

import { useEffect, useState } from "react";
import { RiCustomerServiceFill } from "react-icons/ri";
import { API_URL } from "@/lib/api";

export default function AdminPresence() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const stream = new EventSource(
      `${API_URL}/api/admin/notifications/presence/stream`,
    );
    stream.addEventListener("presence", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent<string>).data);
        setOnline(typeof data?.online === "boolean" ? data.online : null);
      } catch {
        setOnline(null);
      }
    });
    // A lost connection means availability is unknown, not that the admin is offline.
    stream.onerror = () => setOnline(null);
    return () => stream.close();
  }, []);
  const vaziyat = online ? "آنلاین" : "آفلاین";
  const label =
    online === null
      ? "در حال بررسی وضعیت مدیر…"
      : online
        ? "مدیر آنلاین است"
        : "مدیر آفلاین است";

  return (
    <div className="flex ">
      <div
        role="status"
        aria-live="polite"
        title={label}
        className={`fixed bottom-5 right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-md ${
          online
            ? "border-green-200 text-green-700"
            : "border-gray-200 text-gray-500"
        }`}
      >
        <RiCustomerServiceFill aria-hidden="true" className="text-2xl" />

        <span
          aria-hidden="true"
          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
            online === null
              ? "bg-amber-400"
              : online
                ? "bg-green-500"
                : "bg-gray-400"
          }`}
        />

        <span className="sr-only">{label}</span>
      </div>
      <p
        className={`fixed bottom-4 right-22 z-40 flex items-center justify-center text-sm h-12 w-12${
          online
            ? "border-green-200 text-green-700"
            : "border-gray-200 text-gray-300"
        }`}
      >
        {vaziyat}
      </p>
    </div>
  );
}
