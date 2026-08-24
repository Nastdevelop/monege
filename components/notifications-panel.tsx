"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { formatDateTimeID } from "@/lib/format";

export interface NotificationItem {
  id: string;
  type: "BILL_REMINDER" | "BUDGET_OVER" | "BUDGET_UNDER";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const iconByType = {
  BILL_REMINDER: "🗓️",
  BUDGET_OVER: "⚠️",
  BUDGET_UNDER: "📉",
};

export function NotificationsPanel({
  items,
  unreadCount,
}: {
  items: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [markError, setMarkError] = useState<string | null>(null);
  const router = useRouter();

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0 && !pending) {
      setMarkError(null);
      startTransition(async () => {
        try {
          const res = await fetch("/api/notifications/read-all", {
            method: "POST",
          });
          if (!res.ok) {
            setMarkError("Gagal menandai notifikasi dibaca");
            return;
          }
          router.refresh();
        } catch {
          setMarkError("Tidak bisa menghubungi server");
        }
      });
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifikasi"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-expense px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-line bg-surface p-2 shadow-lg">
            <p className="px-3 py-2 text-sm font-semibold">Notifikasi</p>
            {markError && (
              <p
                role="alert"
                className="mx-2 mb-1 rounded-lg bg-expense/10 px-3 py-2 text-xs text-expense"
              >
                {markError}
              </p>
            )}
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-secondary">
                Belum ada notifikasi
              </p>
            ) : (
              <ul className="max-h-96 overflow-y-auto">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={`flex gap-3 rounded-lg px-3 py-2.5 ${
                      n.isRead ? "" : "bg-accent/10"
                    }`}
                  >
                    <span className="text-base leading-none pt-0.5">
                      {iconByType[n.type]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-secondary">{n.message}</p>
                      <p className="mt-1 text-[11px] text-secondary">
                        {formatDateTimeID(n.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function MarkAllReadIcon() {
  return <CheckCheck className="h-4 w-4" />;
}
