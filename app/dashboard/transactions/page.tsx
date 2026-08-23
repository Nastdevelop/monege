import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { startOfToday, endOfToday, formatIDR } from "@/lib/format";
import { TransactionFormDialog } from "@/components/transaction/transaction-form";
import { TransactionList } from "@/components/transaction/transaction-list";

export const metadata = { title: "Transaksi — Monege" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;

  const typeParam = sp.type;
  const typeFilter =
    typeParam === "INCOME" || typeParam === "EXPENSE" ? typeParam : undefined;

  const [wallets, tags, transactions] = await Promise.all([
    prisma.wallet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tag.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.transaction.findMany({
      where: {
        wallet: { userId: user.id },
        type: typeFilter ?? { not: "TRANSFER" },
        date: { gte: startOfToday(), lte: endOfToday() },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200,
      include: { tag: true, wallet: true },
    }),
  ]);

  const walletOptions = wallets.map((w) => ({ id: w.id, name: w.name }));
  const tagOptions = tags.map((t) => ({
    id: t.id,
    name: t.name,
    kind: t.kind,
  }));

  const incomeTotal = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((a, t) => a + Number(t.amount), 0);
  const expenseTotal = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((a, t) => a + Number(t.amount), 0);

  function pillHref(target: "INCOME" | "EXPENSE") {
    return typeFilter === target
      ? "/dashboard/transactions"
      : `/dashboard/transactions?type=${target}`;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaksi</h1>
          <p className="mt-1 text-sm text-secondary">
            Pemasukan dan pengeluaran hari ini.
          </p>
        </div>
        {wallets.length > 0 && (
          <TransactionFormDialog
            wallets={walletOptions}
            tags={tagOptions}
            defaultWalletId={wallets.find((w) => w.isDefault)?.id}
          />
        )}
      </div>

      <div className="tabular-nums mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          Masuk hari ini:{" "}
          <span className="font-bold text-income">{formatIDR(incomeTotal)}</span>
        </span>
        <span>
          Keluar hari ini:{" "}
          <span className="font-bold text-expense">{formatIDR(expenseTotal)}</span>
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={pillHref("INCOME")}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
            typeFilter === "INCOME"
              ? "border-transparent bg-income/20 text-income"
              : "border-line bg-surface text-secondary hover:text-primary"
          }`}
        >
          Pemasukan
        </Link>
        <Link
          href={pillHref("EXPENSE")}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
            typeFilter === "EXPENSE"
              ? "border-transparent bg-expense/20 text-expense"
              : "border-line bg-surface text-secondary hover:text-primary"
          }`}
        >
          Pengeluaran
        </Link>
      </div>

      <div className="mt-5">
        {wallets.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line text-sm text-secondary">
            Buat wallet dulu di halaman Dashboard untuk mulai mencatat.
          </div>
        ) : (
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
            emptyText={
              typeFilter
                ? `Belum ada ${
                    typeFilter === "INCOME" ? "pemasukan" : "pengeluaran"
                  } hari ini`
                : "Belum ada transaksi hari ini"
            }
          />
        )}
      </div>
    </div>
  );
}
