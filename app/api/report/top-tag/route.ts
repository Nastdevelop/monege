import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { startOfToday } from "@/lib/format";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const url = new URL(request.url);
  const daysParam = Number(url.searchParams.get("days") ?? 1);
  const days = [1, 7, 30].includes(daysParam) ? daysParam : 1;

  const cutoff = startOfToday();
  cutoff.setDate(cutoff.getDate() - (days - 1));

  const topRows = await prisma.$queryRaw<
    Array<{ name: string; total: unknown }>
  >`
    SELECT g.name AS name, SUM(t.amount) AS total
    FROM "Transaction" t
    JOIN "Wallet" w ON w.id = t."walletId"
    JOIN "Tag" g ON g.id = t."tagId"
    WHERE w."userId" = ${user.id}
      AND t."type" = 'EXPENSE'::"TransactionType"
      AND t."date" >= ${cutoff}
      AND g.name NOT IN ('Transfer', 'Transfer Keluar', 'Transfer Masuk')
    GROUP BY g.name
    ORDER BY SUM(t.amount) DESC
    LIMIT 1
  `;

  const totalAgg = await prisma.transaction.aggregate({
    where: {
      wallet: { userId: user.id },
      type: "EXPENSE",
      date: { gte: cutoff },
      tag: { name: { notIn: ["Transfer", "Transfer Keluar", "Transfer Masuk"] } },
    },
    _sum: { amount: true },
  });

  const overallTotal = Number(totalAgg._sum.amount ?? 0);
  const top = topRows[0];

  return NextResponse.json({
    tagName: top?.name ?? null,
    total: Number(top?.total ?? 0),
    overallTotal,
    days,
  });
}
