import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { SavingsManager } from "@/components/saving/savings-manager";

export const metadata = { title: "Tabungan — Monege" };

export default async function SavingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [goals, wallets] = await Promise.all([
    prisma.savingGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { contributions: { orderBy: { contributedAt: "asc" } } },
    }),
    prisma.wallet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight">Tabungan Bertarget</h1>
      <p className="mt-1 text-sm text-secondary">
        Set target dan tenggat, sistem hitung kebutuhan nabungmu otomatis.
      </p>
      <div className="mt-6">
        <SavingsManager
          wallets={wallets.map((w) => ({ id: w.id, name: w.name }))}
          goals={goals.map((g) => ({
            id: g.id,
            title: g.title,
            targetAmount: Number(g.targetAmount),
            currentAmount: Number(g.currentAmount),
            targetDate: g.targetDate.toISOString(),
            walletId: g.walletId,
            contributions: g.contributions.map((c) => ({
              id: c.id,
              amount: Number(c.amount),
              contributedAt: c.contributedAt.toISOString(),
            })),
          }))}
        />
      </div>
    </div>
  );
}
