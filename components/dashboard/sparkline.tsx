"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

export function Sparkline({
  values,
  kind,
}: {
  values: number[];
  kind: "income" | "expense";
}) {
  const data = values.map((v, i) => ({ i, v }));
  const color = kind === "income" ? "var(--income)" : "var(--expense)";
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={color}
            fillOpacity={0.15}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
