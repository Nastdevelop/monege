"use server";

import { prisma } from "@/lib/prisma";
import {
  requireUserId,
  fail,
  done,
  getOrCreateTag,
  type ActionResult,
} from "./helpers";
import { isValidAmount, LIMITS, DEBT_RECEIVED_TAG, LOAN_GIVEN_TAG } from "@/lib/constants";

export async function createDebt(
  personName: string,
  direction: "I_OWE" | "OWED_TO_ME",
  walletId: string,
  amount: number,
  dueDate: string | undefined,
  isNew: boolean
): Promise<ActionResult> {
  const userId = await requireUserId();
  const trimmed = personName.trim();
  if (trimmed.length < LIMITS.personName.min || trimmed.length > LIMITS.personName.max)
    return fail(`Nama orang ${LIMITS.personName.min}-${LIMITS.personName.max} karakter`);
  if (!isValidAmount(amount)) return fail("Nominal tidak valid");

  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, userId },
  });
  if (!wallet) return fail("Wallet tidak ditemukan");

  let initialTagId: string | null = null;
  if (isNew) {
    if (direction === "I_OWE") {
      const tag = await getOrCreateTag(userId, DEBT_RECEIVED_TAG, "INCOME");
      initialTagId = tag.id;
    } else {
      if (Number(wallet.balance) < amount)
        return fail("Saldo wallet tidak cukup untuk memberi pinjaman");
      const tag = await getOrCreateTag(userId, LOAN_GIVEN_TAG, "EXPENSE");
      initialTagId = tag.id;
    }
  }

  const due = dueDate ? new Date(dueDate) : null;
  if (due && Number.isNaN(due.getTime()))
    return fail("Tanggal jatuh tempo tidak valid");

  await prisma.$transaction(async (tx) => {
    let initialTransactionId: string | null = null;

    if (isNew && initialTagId) {
      const isIncome = direction === "I_OWE";
      const created = await tx.transaction.create({
        data: {
          walletId,
          tagId: initialTagId,
          type: isIncome ? "INCOME" : "EXPENSE",
          amount,
          note: isIncome ? `Utang dari ${trimmed}` : `Pinjaman untuk ${trimmed}`,
        },
        select: { id: true },
      });
      initialTransactionId = created.id;
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: isIncome ? amount : -amount } },
      });
    }

    await tx.debt.create({
      data: {
        userId,
        walletId,
        personName: trimmed,
        direction,
        amount,
        dueDate: due && !Number.isNaN(due.getTime()) ? due : null,
        initialTransactionId,
      },
    });
  });
  return done();
}

export async function payDebt(
  debtId: string,
  amount: number
): Promise<ActionResult & { paidOff?: boolean }> {
  const userId = await requireUserId();
  if (!isValidAmount(amount)) return fail("Nominal tidak valid");

  const debt = await prisma.debt.findFirst({
    where: { id: debtId, userId },
    include: { wallet: true },
  });
  if (!debt) return fail("Utang tidak ditemukan");

  const remaining = Number(debt.amount) - Number(debt.paidAmount);
  if (remaining <= 0) return fail("Utang sudah lunas");
  if (amount > remaining)
    return fail(`Melebihi sisa utang (${remaining})`);

  const isPaying = debt.direction === "I_OWE";
  const walletBalance = Number(debt.wallet.balance);
  if (isPaying && walletBalance < amount)
    return fail("Saldo wallet tidak cukup untuk membayar utang");

  const tagName = isPaying ? "Bayar Utang" : "Terima Piutang";
  const kind = isPaying ? "EXPENSE" : "INCOME";
  const { id: tagId } = await getOrCreateTag(userId, tagName, kind);

  const newPaid = Number(debt.paidAmount) + amount;
  const status = newPaid >= Number(debt.amount) ? "PAID" : "PARTIAL";

  await prisma.$transaction([
    prisma.debtPayment.create({ data: { debtId, amount } }),
    prisma.debt.update({
      where: { id: debtId },
      data: { paidAmount: newPaid, status },
    }),
    prisma.transaction.create({
      data: {
        walletId: debt.walletId,
        tagId,
        type: isPaying ? "EXPENSE" : "INCOME",
        amount,
        note: `${isPaying ? "Bayar utang ke" : "Terima piutang dari"} ${debt.personName}`,
      },
    }),
    prisma.wallet.update({
      where: { id: debt.walletId },
      data: {
        balance: isPaying ? { decrement: amount } : { increment: amount },
      },
    }),
  ]);

  return { ok: true, paidOff: status === "PAID" };
}

export async function deleteDebt(
  debtId: string
): Promise<ActionResult> {
  const userId = await requireUserId();

  const debt = await prisma.debt.findFirst({
    where: { id: debtId, userId },
  });
  if (!debt) return fail("Utang tidak ditemukan");

  await prisma.$transaction(async (tx) => {
    if (debt.initialTransactionId) {
      const initialTx = await tx.transaction.findUnique({
        where: { id: debt.initialTransactionId },
      });
      if (initialTx) {
        const delta =
          initialTx.type === "INCOME"
            ? -Number(initialTx.amount)
            : Number(initialTx.amount);
        await tx.wallet.update({
          where: { id: initialTx.walletId },
          data: { balance: { increment: delta } },
        });
        await tx.debt.updateMany({
          where: { id: debtId },
          data: { initialTransactionId: null },
        });
        await tx.transaction.delete({ where: { id: initialTx.id } });
      }
    }
    await tx.debtPayment.deleteMany({ where: { debtId } });
    await tx.debt.delete({ where: { id: debtId } });
  });
  return done();
}
