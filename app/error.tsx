"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[monege] render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-lg font-semibold">
        Terjadi kesalahan saat menampilkan halaman
      </h2>
      <p className="max-w-sm text-sm text-secondary">
        Data tidak berhasil dimuat. Coba lagi, atau kembali ke dashboard.
        {error.digest && (
          <span className="mt-1 block text-xs text-secondary/70">
            Kode error: {error.digest}
          </span>
        )}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Coba Lagi
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-hover"
        >
          Ke Dashboard
        </Link>
      </div>
    </div>
  );
}
