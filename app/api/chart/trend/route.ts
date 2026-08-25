import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { startOfToday, dateKeyWIB } from "@/lib/format";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rangeParam = Number(url.searchParams.get("range") ?? 30);
  const rangeDays = [7, 30, 365].includes(rangeParam) ? rangeParam : 30;

  const cutoff = new Date(
    startOfToday().getTime() - (rangeDays - 1) * 86_400_000
  );

  const rows: Array<{ day: Date; type: string; total: unknown }> =
    await prisma.$queryRaw`
      SELECT date_trunc('day', t."date") AS day,
             t."type"::text AS type,
             SUM(t.amount) AS total
      FROM "Transaction" t
      JOIN "Wallet" w ON w.id = t."walletId"
      JOIN "Tag" g ON g.id = t."tagId"
      WHERE w."userId" = ${user.id}
        AND t."date" >= ${cutoff}
        AND g.name <> 'Transfer'
      GROUP BY 1, 2
      ORDER BY 1
    `;

  const map = new Map<string, { income: number; expense: number }>();

  for (let i = 0; i < rangeDays; i++) {
    map.set(dateKeyWIB(new Date(cutoff.getTime() + i * 86_400_000)), {
      income: 0,
      expense: 0,
    });
  }
  for (const row of rows) {
    const key = dateKeyWIB(new Date(row.day));
    const entry = map.get(key);
    if (!entry) continue;
    if (row.type === "INCOME") entry.income = Number(row.total);
    else entry.expense = Number(row.total);
  }

  const points = Array.from(map.entries()).map(([date, v]) => ({
    date,
    ...v,
  }));

  return NextResponse.json({ points });
}
