import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarClock, Gauge } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatIDR, formatDateID, startOfToday } from "@/lib/format";
import { ChartCard } from "@/components/dashboard/chart-card";
import { Sparkline } from "@/components/dashboard/sparkline";
import { getBudgetStatuses, getTodayRealization } from "@/lib/budget-status";

export const metadata = { title: "Dashboard — Monege" };

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [wallets, sparkRowsRaw, nearestBills, budgetStatuses, todayRealization] =
    await Promise.all([
      prisma.wallet.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.$queryRaw<
        Array<{ walletId: string; day: Date; net: unknown }>
      >`
        SELECT t."walletId",
               date_trunc('day', t."date") AS day,
               SUM(CASE WHEN t."type" = 'INCOME' THEN t.amount ELSE -t.amount END) AS net
        FROM "Transaction" t
        JOIN "Wallet" w ON w.id = t."walletId"
        WHERE w."userId" = ${user.id}
          AND t."date" >= NOW() - INTERVAL '6 days'
        GROUP BY 1, 2
        ORDER BY 2
      `,
      prisma.bill.findMany({
        where: { userId: user.id, isPaid: false, dueDate: { gte: startOfToday() } },
        orderBy: { dueDate: "asc" },
        take: 3,
      }),
      getBudgetStatuses(user.id),
      getTodayRealization(user.id),
    ]);

  const todayIncome = Number(
    todayRealization.find((t) => t.type === "INCOME")?._sum.amount ?? 0
  );
  const todayExpense = Number(
    todayRealization.find((t) => t.type === "EXPENSE")?._sum.amount ?? 0
  );

  const totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance), 0);

  const sparkByWallet = new Map<string, number[]>();
  for (const row of sparkRowsRaw) {
    const list = sparkByWallet.get(row.walletId) ?? [];
    const prev = list.length > 0 ? list[list.length - 1] : 0;
    list.push(prev + Number(row.net));
    sparkByWallet.set(row.walletId, list);
  }
  for (const [key, list] of sparkByWallet) {
    while (list.length < 7) list.unshift(list[0] ?? 0);
    sparkByWallet.set(key, list.slice(-7));
  }

  const problemBudgets = budgetStatuses.filter(
    (b) => b.status === "OVER" || b.status === "UNDER"
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Halo, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-secondary">Total saldo gabungan</p>
          <p className="tabular-nums text-3xl font-bold text-accent">
            {formatIDR(totalBalance)}
          </p>
        </div>
        <Link
          href="/dashboard/wallets"
          className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-hover"
        >
          Kelola Wallet
        </Link>
      </div>

      {wallets.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wallets.map((w) => (
            <Link
              key={w.id}
              href={`/dashboard/wallets/${w.id}`}
              className="flex items-center justify-between rounded-xl border border-line bg-surface p-5 transition-colors hover:bg-surface-hover"
            >
              <div>
                <p className="text-sm font-medium text-secondary">{w.name}</p>
                <p className="tabular-nums mt-1 text-lg font-bold">
                  {formatIDR(Number(w.balance))}
                </p>
              </div>
              <Sparkline
                values={sparkByWallet.get(w.id) ?? [0]}
                kind={(sparkByWallet.get(w.id)?.slice(-1)[0] ?? 0) >= 0 ? "income" : "expense"}
              />
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-secondary">Pemasukan Hari Ini</p>
          <p className="tabular-nums mt-2 text-xl font-bold text-income">
            {formatIDR(todayIncome)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm text-secondary">Pengeluaran Hari Ini</p>
          <p className="tabular-nums mt-2 text-xl font-bold text-expense">
            {formatIDR(todayExpense)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard kind="income" title="Tren Pemasukan" />
        <ChartCard kind="expense" title="Tren Pengeluaran" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="h-4 w-4 text-warning" /> Tagihan Terdekat
            </h3>
            <Link
              href="/dashboard/bills"
              className="flex items-center gap-1 text-xs font-medium text-accent"
            >
              Lihat semua <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {nearestBills.length === 0 ? (
            <p className="mt-4 text-sm text-secondary">Tidak ada tagihan aktif.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {nearestBills.map((bill) => (
                <li
                  key={bill.id}
                  className="flex items-center justify-between rounded-lg bg-background px-3 py-2"
                >
                  <span className="truncate text-sm">{bill.title}</span>
                  <span className="whitespace-nowrap text-xs text-secondary">
                    jatuh tempo {formatDateID(bill.dueDate)} ·{" "}
                    <span className="font-semibold text-primary">
                      {formatIDR(Number(bill.amount))}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Gauge className="h-4 w-4 text-warning" /> Budget Hari Ini
            </h3>
            <Link
              href="/dashboard/budget"
              className="flex items-center gap-1 text-xs font-medium text-accent"
            >
              Atur <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {budgetStatuses.length === 0 ? (
            <p className="mt-4 text-sm text-secondary">
              Belum ada aturan budget harian.
            </p>
          ) : problemBudgets.length === 0 ? (
            <p className="mt-4 text-sm text-income">
              Semua aturan budget on track hari ini.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {problemBudgets.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm">
                    {b.kind === "income"
                      ? "Pemasukan harian"
                      : b.kind === "saving"
                        ? "Nabung harian"
                        : `Pengeluaran ${b.tagName}`}
                  </span>
                  <span
                    className={`whitespace-nowrap text-xs font-semibold ${
                      b.status === "OVER" ? "text-expense" : "text-warning"
                    }`}
                  >
                    {b.status === "OVER"
                      ? `over ${formatIDR(b.actual - b.targetAmount)}`
                      : `${Math.round((b.actual / b.targetAmount) * 100)}% dari target`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
