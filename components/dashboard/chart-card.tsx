"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RANGES = [
  { key: "7", label: "7H" },
  { key: "30", label: "30H" },
  { key: "365", label: "12B" },
] as const;

interface TrendPoint {
  date: string;
  income: number;
  expense: number;
}

async function fetchTrend(range: string): Promise<TrendPoint[]> {
  const res = await fetch(`/api/chart/trend?range=${range}`);
  if (!res.ok) throw new Error("Gagal memuat data");
  const data = await res.json();
  return data.points as TrendPoint[];
}

function shortDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function ChartCard({
  kind,
  title,
}: {
  kind: "income" | "expense";
  title: string;
}) {
  const [range, setRange] = useState<string>("30");
  const { data, isLoading } = useQuery({
    queryKey: ["trend", range],
    queryFn: () => fetchTrend(range),
    select: (points: TrendPoint[]) =>
      points.map((p) => ({
        ...p,
        label: shortDate(p.date),
        value: kind === "income" ? p.income : p.expense,
      })),
  });

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="grid grid-cols-3 gap-0.5 rounded-lg border border-line p-0.5 text-xs font-medium">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`rounded-md px-2 py-1 transition-colors ${
                range === r.key
                  ? "bg-accent/20 text-accent"
                  : "text-secondary hover:text-primary"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`mt-4 h-56 ${
          kind === "income" ? "text-income" : "text-expense"
        }`}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-secondary">
            Memuat...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data ?? []} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
              <defs>
                <linearGradient id={`grad-${kind}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                minTickGap={24}
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}jt`
                    : v >= 1000
                      ? `${(v / 1000).toFixed(0)}rb`
                      : String(v)
                }
              />
              <Tooltip
                formatter={(value) => [
                  `Rp${Number(value).toLocaleString("id-ID")}`,
                  kind === "income" ? "Pemasukan" : "Pengeluaran",
                ]}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="currentColor"
                strokeWidth={2}
                fill={`url(#grad-${kind})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
