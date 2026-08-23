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

export function ActionOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [busyCount, setBusyCount] = useState(0);

  const run = useCallback<Runner>(async (fn) => {
    setBusyCount((c) => c + 1);
    const startedAt = Date.now();
    try {
      return await fn();
    } catch {
      return undefined;
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
