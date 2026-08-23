"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId, fail, done, type ActionResult } from "./helpers";
import { isValidAmount } from "@/lib/constants";

export interface TransactionInput {
  walletId: string;
  tagId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  note?: string;
  date?: string;
}

function validateInput(input: TransactionInput): string | null {
  if (!isValidAmount(input.amount))
    return "Nominal harus bilangan bulat antara Rp1 - Rp999 miliar";
  const trimmedNote = input.note?.trim() ?? "";
  if (trimmedNote.length > 200) return "Catatan maksimal 200 karakter";
  return null;
}

function effect(type: string, amount: number): number {
  return type === "INCOME" ? amount : -amount;
}

export async function createTransaction(
  input: TransactionInput
): Promise<ActionResult> {
  const userId = await requireUserId();

  const invalid = validateInput(input);
  if (invalid) return fail(invalid);

  const wallet = await prisma.wallet.findFirst({
    where: { id: input.walletId, userId },
  });
  if (!wallet) return fail("Wallet tidak ditemukan");

  const tag = await prisma.tag.findFirst({
    where: { id: input.tagId, userId },
  });
  if (!tag) return fail("Tag tidak ditemukan");
  if (tag.kind !== input.type)
    return fail(`Tag "${tag.name}" bukan tag ${input.type === "INCOME" ? "pemasukan" : "pengeluaran"}`);

  const delta = effect(input.type, input.amount);
  if (Number(wallet.balance) + delta < 0)
    return fail("Saldo wallet tidak cukup");

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        walletId: input.walletId,
        tagId: input.tagId,
        type: input.type,
        amount: input.amount,
        note: input.note?.trim() || null,
        date: input.date ? new Date(input.date) : new Date(),
      },
    }),
    prisma.wallet.update({
      where: { id: input.walletId },
      data: { balance: { increment: delta } },
    }),
  ]);
  return done();
}

export async function updateTransaction(
  id: string,
  input: TransactionInput
): Promise<ActionResult> {
  const userId = await requireUserId();

  const invalid = validateInput(input);
  if (invalid) return fail(invalid);

  const existing = await prisma.transaction.findFirst({
    where: { id, wallet: { userId } },
  });
  if (!existing) return fail("Transaksi tidak ditemukan");

  const wallet = await prisma.wallet.findFirst({
    where: { id: input.walletId, userId },
  });
  if (!wallet) return fail("Wallet tidak ditemukan");

  const tag = await prisma.tag.findFirst({
    where: { id: input.tagId, userId },
  });
  if (!tag) return fail("Tag tidak ditemukan");
  if (tag.kind !== input.type)
    return fail(`Tag "${tag.name}" bukan tag ${input.type === "INCOME" ? "pemasukan" : "pengeluaran"}`);

  const oldDelta = effect(existing.type, Number(existing.amount));
  const newDelta = effect(input.type, input.amount);

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.wallet.findUnique({
        where: { id: existing.walletId },
      });
      if (!current) throw new Error("Wallet hilang");
      const projected = Number(current.balance) - oldDelta + newDelta;
      if (projected < 0) throw new Error("Saldo wallet tidak cukup");

      await tx.transaction.update({
        where: { id },
        data: {
          walletId: input.walletId,
          tagId: input.tagId,
          type: input.type,
          amount: input.amount,
          note: input.note?.trim() || null,
          date: input.date ? new Date(input.date) : existing.date,
        },
      });
      if (existing.walletId !== input.walletId) {
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: { balance: { decrement: oldDelta } },
        });
        await tx.wallet.update({
          where: { id: input.walletId },
          data: { balance: { increment: newDelta } },
        });
      } else {
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: { balance: { increment: newDelta - oldDelta } },
        });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Saldo wallet tidak cukup")
      return fail(e.message);
    throw e;
  }
  return done();
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const existing = await prisma.transaction.findFirst({
    where: { id, wallet: { userId } },
  });
  if (!existing) return fail("Transaksi tidak ditemukan");

  const delta = effect(existing.type, Number(existing.amount));

  await prisma.$transaction([
    prisma.transaction.delete({ where: { id } }),
    prisma.wallet.update({
      where: { id: existing.walletId },
      data: { balance: { decrement: delta } },
    }),
  ]);
  return done();
}
