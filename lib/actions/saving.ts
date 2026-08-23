"use server";

import { prisma } from "@/lib/prisma";
import {
  requireUserId,
  fail,
  done,
  getOrCreateTag,
  type ActionResult,
} from "./helpers";
import { isValidAmount, LIMITS, SAVING_TAG } from "@/lib/constants";

export async function createSavingGoal(
  title: string,
  targetAmount: number,
  targetDate: string,
  walletId: string
): Promise<ActionResult> {
  const userId = await requireUserId();
  const trimmed = title.trim();
  if (trimmed.length < LIMITS.title.min || trimmed.length > LIMITS.title.max)
    return fail(`Judul target ${LIMITS.title.min}-${LIMITS.title.max} karakter`);
  if (!isValidAmount(targetAmount)) return fail("Nominal target tidak valid");

  const date = new Date(targetDate);
  if (Number.isNaN(date.getTime())) return fail("Tanggal target tidak valid");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() <= today.getTime())
    return fail("Tanggal target harus di masa depan");

  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, userId },
  });
  if (!wallet) return fail("Wallet tidak ditemukan");

  await prisma.savingGoal.create({
    data: {
      userId,
      walletId,
      title: trimmed,
      targetAmount,
      targetDate: date,
    },
  });
  return done();
}

export async function contribute(
  goalId: string,
  amount: number
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!isValidAmount(amount)) return fail("Nominal tidak valid");

  const goal = await prisma.savingGoal.findFirst({
    where: { id: goalId, userId },
    include: { wallet: true },
  });
  if (!goal) return fail("Target tabungan tidak ditemukan");

  const current = Number(goal.currentAmount);
  const target = Number(goal.targetAmount);
  const remaining = Math.max(0, target - current);
  if (remaining <= 0) return fail("Target sudah tercapai");
  const effective = Math.min(amount, remaining);

  if (Number(goal.wallet.balance) < effective)
    return fail("Saldo wallet tidak cukup");

  const { id: tagId } = await getOrCreateTag(userId, SAVING_TAG, "EXPENSE");
  const newCurrent = current + effective;

  await prisma.$transaction([
    prisma.savingContribution.create({
      data: { savingGoalId: goalId, amount: effective },
    }),
    prisma.savingGoal.update({
      where: { id: goalId },
      data: { currentAmount: newCurrent },
    }),
    prisma.transaction.create({
      data: {
        walletId: goal.walletId,
        tagId,
        type: "EXPENSE",
        amount: effective,
        note: `Nabung: ${goal.title}`,
      },
    }),
    prisma.wallet.update({
      where: { id: goal.walletId },
      data: { balance: { decrement: effective } },
    }),
  ]);
  return done();
}

export async function deleteSavingGoal(
  goalId: string,
  confirmed: boolean
): Promise<ActionResult> {
  const userId = await requireUserId();

  const goal = await prisma.savingGoal.findFirst({
    where: { id: goalId, userId },
    include: { _count: { select: { contributions: true } } },
  });
  if (!goal) return fail("Target tidak ditemukan");

  if (goal._count.contributions > 0 && !confirmed) return fail("CONFIRM_NEEDED");

  await prisma.$transaction(async (tx) => {
    await tx.savingContribution.deleteMany({ where: { savingGoalId: goalId } });
    await tx.savingGoal.delete({ where: { id: goalId } });
  });
  return done();
}
