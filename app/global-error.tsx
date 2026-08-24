"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[monege] global error:", error);
  }, [error]);

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#141414",
          color: "#f5f5f5",
        }}
      >
        <div style={{ textAlign: "center", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", margin: 0 }}>
            Terjadi kesalahan pada aplikasi
          </h2>
          <p
            style={{ fontSize: "0.875rem", opacity: 0.7, maxWidth: "24rem" }}
          >
            Aplikasi tidak berhasil dimuat. Coba muat ulang halaman.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "0.75rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#e8c46a",
              color: "#141414",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}
