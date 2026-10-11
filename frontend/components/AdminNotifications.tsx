"use client";

import { useEffect, useState } from "react";
import { api, ApiError, API_URL, getAccessToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ADMIN_REQUESTS_UPDATED } from "@/lib/admin-notifications";

export default function AdminNotifications() {
  const { user, loading } = useAuth();
  const adminId = !loading && user?.role === "ADMIN" ? user.id : null;
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setNotice(null);
    if (!adminId) return;

    let disposed = false;
    let stream: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retryDelay = 1_000;
    const controller = new AbortController();

    function scheduleReconnect() {
      if (disposed) return;
      // Only retry a failed SSE connection; this never polls for requests.
      retryTimer = setTimeout(() => void connect(true), retryDelay);
      retryDelay = Math.min(retryDelay * 2, 30_000);
    }

    async function connect(checkSession = false) {
      try {
        if (checkSession) {
          // The shared API client refreshes expired tokens on a 401.
          await api("/api/auth/me", { signal: controller.signal });
        }
        if (disposed) return;

        const token = getAccessToken();
        if (!token) return;

        const source = new EventSource(
          `${API_URL}/api/admin/notifications/stream?token=${encodeURIComponent(token)}`,
        );
        stream = source;

        source.addEventListener("connected", () => {
          if (disposed) return;
          retryDelay = 1_000;
          // Also catch up on requests created while the connection was interrupted.
          window.dispatchEvent(new Event(ADMIN_REQUESTS_UPDATED));
        });

        source.addEventListener("notification", (event) => {
          if (disposed) return;
          try {
            const data = JSON.parse((event as MessageEvent<string>).data);
            if (data?.type === "NEW_HELP_REQUEST") {
              setNotice("درخواست مشاوره جدید ثبت شد");
              window.dispatchEvent(new Event(ADMIN_REQUESTS_UPDATED));
            }
          } catch {
            // Ignore malformed events without breaking the active connection.
          }
        });

        source.onerror = () => {
          if (disposed || stream !== source) return;
          source.close();
          stream = null;
          scheduleReconnect();
        };
      } catch (error) {
        if (disposed) return;
        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          return;
        }
        scheduleReconnect();
      }
    }

    void connect();

    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(retryTimer);
      stream?.close();
    };
  }, [adminId]);

  if (!adminId || !notice) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 right-4 left-4 z-50 flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-white p-4 text-sm text-blue-800 shadow-lg sm:left-auto"
    >
      <span>{notice}</span>
      <button
        type="button"
        aria-label="بستن اعلان"
        className="cursor-pointer text-gray-500 hover:text-gray-800"
        onClick={() => setNotice(null)}
      >
        ✕
      </button>
    </div>
  );
}
