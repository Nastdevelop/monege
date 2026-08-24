"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Loader2 } from "lucide-react";

type Runner = <T>(fn: () => Promise<T>) => Promise<T | undefined>;

const OverlayContext = createContext<{ run: Runner }>({
  run: async (fn) => fn(),
});

export function useActionRunner() {
  return useContext(OverlayContext).run;
}

const MIN_VISIBLE_MS = 500;

function describeActionError(err: unknown): string {
  if (err instanceof TypeError) {
    return "Tidak bisa menghubungi server. Periksa koneksi internet lalu coba lagi.";
  }
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") {
      return "Sesi login berakhir. Muat ulang halaman untuk masuk kembali.";
    }
    return "Terjadi kesalahan di server saat memproses data. Coba lagi beberapa saat.";
  }
  return "Terjadi kesalahan tak terduga. Coba lagi.";
}

export function ActionOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [busyCount, setBusyCount] = useState(0);

  const run = useCallback(async <T,>(
    fn: () => Promise<T>
  ): Promise<T | undefined> => {
    setBusyCount((c) => c + 1);
    const startedAt = Date.now();
    try {
      return await fn();
    } catch (err) {
      console.error("[monege] aksi gagal:", err);
      return {
        ok: false,
        error: describeActionError(err),
      } as unknown as T;
    } finally {
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      setTimeout(() => {
        setBusyCount((c) => Math.max(0, c - 1));
      }, wait);
    }
  }, []);

  const value = useMemo(() => ({ run }), [run]);

  return (
    <OverlayContext.Provider value={value}>
      {children}
      {busyCount > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-5 py-4 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <span className="text-sm font-medium">Memproses...</span>
          </div>
        </div>
      )}
    </OverlayContext.Provider>
  );
}
