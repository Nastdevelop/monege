import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatIDR } from "@/lib/format";
import { TransactionFormDialog } from "@/components/transaction/transaction-form";
import { TransactionList } from "@/components/transaction/transaction-list";

export const metadata = { title: "Detail Wallet — Monege" };

export default async function WalletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId: user.id },
  });
  if (!wallet) notFound();

  const [transactions, tags] = await Promise.all([
    prisma.transaction.findMany({
      where: { walletId: id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: { tag: true },
    }),
    prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard/wallets"
        className="inline-flex items-center gap-1 text-sm text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{wallet.name}</h1>
          <p className="tabular-nums mt-1 text-xl font-bold">
            {formatIDR(Number(wallet.balance))}
          </p>
        </div>
        <TransactionFormDialog
          wallets={[{ id: wallet.id, name: wallet.name }]}
          tags={tags.map((t) => ({ id: t.id, name: t.name, kind: t.kind }))}
          defaultWalletId={wallet.id}
        />
      </div>

      <div className="mt-6">
        <TransactionList
          wallets={[{ id: wallet.id, name: wallet.name }]}
          tags={tags.map((t) => ({ id: t.id, name: t.name, kind: t.kind }))}
          showWallet={false}
          items={transactions.map((tx) => ({
            id: tx.id,
            type: tx.type,
            amount: Number(tx.amount),
            note: tx.note,
            date: tx.date.toISOString(),
            tagName: tx.tag.name,
            tagKind: tx.tag.kind,
            walletName: wallet.name,
          }))}
          emptyText="Belum ada transaksi di wallet ini"
        />
      </div>
    </div>
  );
}
