import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { WalletManager } from "@/components/wallet/wallet-manager";

export const metadata = { title: "Wallet — Monege" };

export default async function WalletsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
      <p className="mt-1 text-sm text-secondary">
        Pisahkan dana per dompet, rekening, atau e-wallet.
      </p>
      <div className="mt-6">
        <WalletManager
          wallets={wallets.map((w) => ({
            id: w.id,
            name: w.name,
            balance: Number(w.balance),
            isDefault: w.isDefault,
            txCount: w._count.transactions,
          }))}
        />
      </div>
    </div>
  );
}
