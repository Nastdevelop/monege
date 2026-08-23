import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { DebtManager } from "@/components/debt/debt-manager";

export const metadata = { title: "Utang & Piutang — Monege" };

export default async function DebtsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [debts, wallets] = await Promise.all([
    prisma.debt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { payments: { orderBy: { paidAt: "asc" } } },
    }),
    prisma.wallet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Utang & Piutang</h1>
      <p className="mt-1 text-sm text-secondary">
        Pembayaran otomatis tercatat di wallet dan laporan transaksi.
      </p>
      <div className="mt-6">
        <DebtManager
          wallets={wallets.map((w) => ({
            id: w.id,
            name: w.name,
            balance: Number(w.balance),
          }))}
          debts={debts.map((d) => ({
            id: d.id,
            personName: d.personName,
            direction: d.direction,
            amount: Number(d.amount),
            paidAmount: Number(d.paidAmount),
            status: d.status,
            dueDate: d.dueDate ? d.dueDate.toISOString() : null,
            walletId: d.walletId,
            hasInitialTx: Boolean(d.initialTransactionId),
            payments: d.payments.map((p) => ({
              id: p.id,
              amount: Number(p.amount),
              paidAt: p.paidAt.toISOString(),
            })),
          }))}
        />
      </div>
    </div>
  );
}
