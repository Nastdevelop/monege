"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing, BellOff } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function PushSettings() {
  const router = useRouter();
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    (async () => {
      const isSupported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window;
      if (!isSupported) {
        if (active) setSupported(false);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        if (active) setSubscribed(Boolean(sub));
      } catch {
        if (active) setSupported(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function enable() {
    setStatus(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Izin notifikasi ditolak di browser.");
        return;
      }
      const res = await fetch("/api/push/public-key");
      if (!res.ok) {
        setStatus("Server belum siap mengirim push.");
        return;
      }
      const { publicKey } = await res.json();
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      setSubscribed(true);
      setStatus("Notifikasi aktif.");
      startTransition(() => router.refresh());
    } catch {
      setStatus("Gagal mengaktifkan notifikasi.");
    }
  }

  async function disable() {
    setStatus(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setStatus("Notifikasi dimatikan.");
    } catch {
      setStatus("Gagal mematikan notifikasi.");
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <BellRing className="h-4 w-4 text-warning" /> Push Notification
      </h3>
      <p className="mt-2 text-sm text-secondary">
        Pengingat tagihan dan peringatan budget harian dikirim langsung ke
        browser.
      </p>
      {!supported ? (
        <p className="mt-3 text-sm text-warning">
          Browser ini tidak mendukung push notification.
        </p>
      ) : (
        <button
          type="button"
          onClick={subscribed ? disable : enable}
          disabled={pending}
          className={`mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 ${
            subscribed
              ? "border border-line text-expense"
              : "bg-accent text-background"
          }`}
        >
          {subscribed ? (
            <>
              <BellOff className="h-4 w-4" /> Matikan Notifikasi
            </>
          ) : (
            <>
              <BellRing className="h-4 w-4" /> Aktifkan Notifikasi
            </>
          )}
        </button>
      )}
      {status && <p className="mt-3 text-sm text-secondary">{status}</p>}
    </div>
  );
}
