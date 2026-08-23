"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId, fail, done, type ActionResult } from "./helpers";
import {
  isValidAmount,
  LIMITS,
  TRANSFER_OUT_TAG,
  TRANSFER_IN_TAG,
} from "@/lib/constants";
import { getOrCreateTag } from "./helpers";

export async function createWallet(
  name: string,
  initialBalance: number
): Promise<ActionResult> {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (trimmed.length < LIMITS.walletName.min || trimmed.length > LIMITS.walletName.max)
    return fail(`Nama wallet ${LIMITS.walletName.min}-${LIMITS.walletName.max} karakter`);
  if (initialBalance !== 0 && !isValidAmount(initialBalance))
    return fail("Saldo awal harus antara Rp1 - Rp999 miliar");

  await prisma.wallet.create({
    data: { userId, name: trimmed, balance: initialBalance },
  });
  return done();
}

export async function updateWallet(
  id: string,
  name: string
): Promise<ActionResult> {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (trimmed.length < LIMITS.walletName.min || trimmed.length > LIMITS.walletName.max)
    return fail(`Nama wallet ${LIMITS.walletName.min}-${LIMITS.walletName.max} karakter`);

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId },
  });
  if (!wallet) return fail("Wallet tidak ditemukan");

  await prisma.wallet.update({ where: { id }, data: { name: trimmed } });
  return done();
}

export async function deleteWallet(
  id: string,
  confirmed: boolean
): Promise<ActionResult> {
  const userId = await requireUserId();

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId },
    include: { _count: { select: { transactions: true } } },
  });
  if (!wallet) return fail("Wallet tidak ditemukan");

  const totalWallets = await prisma.wallet.count({ where: { userId } });
  if (totalWallets <= 1) return fail("Minimal harus punya satu wallet");

  const hasHistory =
    wallet._count.transactions > 0 ||
    wallet.isDefault ||
    Number(wallet.balance) !== 0;

  if (hasHistory && !confirmed) {
    return fail("CONFIRM_NEEDED");
  }

  await prisma.$transaction(async (tx) => {
    await tx.debtPayment.deleteMany({
      where: { debt: { walletId: id, userId } },
    });
    await tx.debt.updateMany({
      where: { walletId: id, userId },
      data: { initialTransactionId: null },
    });
    await tx.debt.deleteMany({ where: { walletId: id, userId } });
    await tx.savingContribution.deleteMany({
      where: { savingGoal: { walletId: id, userId } },
    });
    await tx.savingGoal.deleteMany({ where: { walletId: id, userId } });
    await tx.transaction.deleteMany({ where: { walletId: id } });
    await tx.wallet.delete({ where: { id } });
  });
  return done();
}

export async function transferBetweenWallets(
  fromWalletId: string,
  toWalletId: string,
  amount: number
): Promise<ActionResult> {
  const userId = await requireUserId();

  if (fromWalletId === toWalletId) return fail("Wallet asal dan tujuan sama");
  if (!isValidAmount(amount)) return fail("Nominal tidak valid");

  const wallets = await prisma.wallet.findMany({
    where: { id: { in: [fromWalletId, toWalletId] }, userId },
  });
  if (wallets.length < 2) return fail("Wallet tidak ditemukan");

  const source = wallets.find((w) => w.id === fromWalletId)!;
  if (Number(source.balance) < amount)
    return fail("Saldo wallet asal tidak cukup");

  const [outTag, inTag] = await Promise.all([
    getOrCreateTag(userId, TRANSFER_OUT_TAG, "EXPENSE"),
    getOrCreateTag(userId, TRANSFER_IN_TAG, "INCOME"),
  ]);

  const targetName = wallets.find((w) => w.id === toWalletId)!.name;

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        walletId: fromWalletId,
        tagId: outTag.id,
        type: "EXPENSE",
        amount,
        note: `Transfer ke ${targetName}`,
      },
    }),
    prisma.transaction.create({
      data: {
        walletId: toWalletId,
        tagId: inTag.id,
        type: "INCOME",
        amount,
        note: `Transfer dari ${source.name}`,
      },
    }),
    prisma.wallet.update({
      where: { id: fromWalletId },
      data: { balance: { decrement: amount } },
    }),
    prisma.wallet.update({
      where: { id: toWalletId },
      data: { balance: { increment: amount } },
    }),
  ]);
  return done();
}
