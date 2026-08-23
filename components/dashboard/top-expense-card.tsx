"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { formatIDR } from "@/lib/format";

const RANGES = [
  { key: 1, label: "Hari Ini" },
  { key: 7, label: "7 Hari" },
  { key: 30, label: "1 Bulan" },
] as const;

interface TopTagData {
  tagName: string | null;
  total: number;
  overallTotal: number;
}

async function fetchTopTag(days: number): Promise<TopTagData> {
  const res = await fetch(`/api/report/top-tag?days=${days}`);
  if (!res.ok) throw new Error("Gagal memuat");
  return res.json();
}

export function TopExpenseCard() {
  const [days, setDays] = useState<number>(1);
  const { data, isLoading } = useQuery({
    queryKey: ["top-tag", days],
    queryFn: () => fetchTopTag(days),
  });

  const pct =
    data && data.overallTotal > 0
      ? Math.round((data.total / data.overallTotal) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="h-4 w-4 text-expense" /> Pengeluaran Terbanyak
        </h3>
        <div className="grid grid-cols-3 gap-0.5 rounded-lg border border-line p-0.5 text-xs font-medium">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setDays(r.key)}
              className={`rounded-md px-2 py-1 transition-colors ${
                days === r.key
                  ? "bg-accent/20 text-accent"
                  : "text-secondary hover:text-primary"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-secondary">Memuat...</p>
      ) : !data || !data.tagName ? (
        <p className="mt-4 text-sm text-secondary">
          Belum ada pengeluaran pada periode ini.
        </p>
      ) : (
        <div className="mt-4">
          <p className="text-lg font-bold">{data.tagName}</p>
          <p className="tabular-nums mt-1 text-xl font-bold text-expense">
            {formatIDR(data.total)}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted-tag">
            <div
              className="h-full rounded-full bg-expense"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-secondary">
            {pct}% dari total pengeluaran ({formatIDR(data.overallTotal)})
          </p>
        </div>
      )}
    </div>
  );
}
