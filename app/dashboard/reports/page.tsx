import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  formatIDR,
  dateKeyWIB,
  parseDateWIB,
  endOfDateWIB,
} from "@/lib/format";
import { TransactionList } from "@/components/transaction/transaction-list";
import { TopExpenseCard } from "@/components/dashboard/top-expense-card";

export const metadata = { title: "Laporan — Monege" };

interface Filters {
  tagId?: string;
  walletId?: string;
  type?: string;
  from?: string;
  to?: string;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;

  const one = (key: keyof Filters) => {
    const v = sp[key];
    return typeof v === "string" && v !== "" ? v : undefined;
  };

  const hasAnyParam = ["tagId", "walletId", "type", "from", "to"].some(
    (k) => typeof sp[k] === "string" && sp[k] !== ""
  );

  const todayStr = dateKeyWIB(new Date());

  const filters: Filters = {
    tagId: one("tagId"),
    walletId: one("walletId"),
    type: one("type"),
    from: hasAnyParam ? one("from") : todayStr,
    to: hasAnyParam ? one("to") : todayStr,
  };

  const [wallets, tags] = await Promise.all([
    prisma.wallet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  const where = {
    wallet: { userId: user.id },
    ...(filters.type === "INCOME" || filters.type === "EXPENSE"
      ? { type: filters.type as "INCOME" | "EXPENSE" }
      : {}),
    ...(filters.tagId ? { tagId: filters.tagId } : {}),
    ...(filters.walletId ? { walletId: filters.walletId } : {}),
    ...(filters.from || filters.to
      ? {
          date: {
            ...(filters.from
              ? { gte: parseDateWIB(filters.from) }
              : {}),
            ...(filters.to ? { lte: endOfDateWIB(filters.to) } : {}),
          },
        }
      : {}),
  };

  const [transactions, totals] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 500,
      include: { tag: true, wallet: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where,
      _sum: { amount: true },
    }),
  ]);

  const incomeTotal = Number(
    totals.find((t) => t.type === "INCOME")?._sum.amount ?? 0
  );
  const expenseTotal = Number(
    totals.find((t) => t.type === "EXPENSE")?._sum.amount ?? 0
  );

  const walletOptions = wallets.map((w) => ({ id: w.id, name: w.name }));
  const tagOptions = tags.map((t) => ({
    id: t.id,
    name: t.name,
    kind: t.kind,
  }));

  const activeFilterDesc =
    filters.tagId && tags.find((t) => t.id === filters.tagId)
      ? `tag "${tags.find((t) => t.id === filters.tagId)!.name}"`
      : null;

  const inputClass =
    "rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
      <p className="mt-1 text-sm text-secondary">
        Filter transaksi dan lihat totalnya secara langsung.
      </p>

      <div className="sticky top-14 z-20 -mx-4 mt-5 border-b border-line bg-background/90 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <form className="flex flex-wrap items-center gap-2">
          <select name="tagId" defaultValue={filters.tagId ?? ""} aria-label="Filter tag" className={inputClass}>
            <option value="">Semua tag</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select name="walletId" defaultValue={filters.walletId ?? ""} aria-label="Filter wallet" className={inputClass}>
            <option value="">Semua wallet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <select name="type" defaultValue={filters.type ?? ""} aria-label="Filter jenis" className={inputClass}>
            <option value="">Semua jenis</option>
            <option value="INCOME">Pemasukan</option>
            <option value="EXPENSE">Pengeluaran</option>
          </select>
          <input
            type="date"
            name="from"
            defaultValue={filters.from ?? ""}
            aria-label="Dari tanggal"
            className={inputClass}
          />
          <input
            type="date"
            name="to"
            defaultValue={filters.to ?? ""}
            aria-label="Sampai tanggal"
            className={inputClass}
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Terapkan
          </button>
          <a
            href="/dashboard/reports"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-secondary transition-colors hover:text-primary"
          >
            Reset
          </a>
        </form>

        <div className="tabular-nums mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span>
            Pemasukan:{" "}
            <span className="font-bold text-income">{formatIDR(incomeTotal)}</span>
          </span>
          <span>
            Pengeluaran:{" "}
            <span className="font-bold text-expense">{formatIDR(expenseTotal)}</span>
          </span>
          <span>
            Selisih:{" "}
            <span
              className={`font-bold ${incomeTotal - expenseTotal >= 0 ? "text-income" : "text-expense"}`}
            >
              {formatIDR(incomeTotal - expenseTotal)}
            </span>
          </span>
        </div>
        {activeFilterDesc && transactions.length > 0 && (
          <p className="mt-1 text-xs text-secondary">
            Total dihitung dari {transactions.length} transaksi dengan filter aktif.
          </p>
        )}
      </div>

      <div className="mt-5">
        <TopExpenseCard />
        {wallets.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line text-sm text-secondary">
            Belum ada data untuk dilaporkan.
          </div>
        ) : (
          <div className="mt-5">
            <TransactionList
              wallets={walletOptions}
              tags={tagOptions}
              items={transactions.map((tx) => ({
                id: tx.id,
                type: tx.type,
                amount: Number(tx.amount),
                note: tx.note,
                date: tx.date.toISOString(),
                tagName: tx.tag.name,
                tagKind: tx.tag.kind,
                walletName: tx.wallet.name,
              }))}
              emptyText="Tidak ada transaksi sesuai filter"
            />
          </div>
        )}
      </div>
    </div>
  );
}
