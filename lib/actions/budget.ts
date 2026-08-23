"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId, fail, done, type ActionResult } from "./helpers";
import { isValidAmount } from "@/lib/constants";

export type BudgetKind = "income" | "expense" | "saving";

export async function createBudget(
  kind: BudgetKind,
  tagName: string | null,
  targetAmount: number
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!isValidAmount(targetAmount))
    return fail("Target nominal harus bilangan bulat antara Rp1 - Rp999 miliar");

  if (kind === "expense") {
    const trimmed = (tagName ?? "").trim();
    if (!trimmed) return fail("Pilih tag untuk budget pengeluaran");
    const tag = await prisma.tag.findUnique({
      where: { userId_name: { userId, name: trimmed } },
    });
    if (!tag) return fail("Tag tidak ditemukan");
    if (tag.kind !== "EXPENSE")
      return fail("Tag harus berjenis pengeluaran");

    const duplicate = await prisma.dailyBudget.findFirst({
      where: { userId, tagName: trimmed, isActive: true },
    });
    if (duplicate) return fail(`Budget untuk tag "${trimmed}" sudah ada`);

    await prisma.dailyBudget.create({
      data: { userId, tagName: trimmed, type: "EXPENSE", targetAmount },
    });
    return done();
  }

  const type = kind === "income" ? "INCOME" : "INCOME";
  const ruleTag = kind === "saving" ? "Nabung" : null;

  const duplicate = await prisma.dailyBudget.findFirst({
    where: { userId, tagName: ruleTag, isActive: true },
  });
  if (duplicate) return fail("Aturan serupa sudah ada");

  await prisma.dailyBudget.create({
    data: { userId, tagName: ruleTag, type, targetAmount },
  });
  return done();
}

export async function updateBudget(
  id: string,
  targetAmount: number,
  isActive: boolean
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!isValidAmount(targetAmount))
    return fail("Target nominal harus bilangan bulat antara Rp1 - Rp999 miliar");

  const rule = await prisma.dailyBudget.findFirst({ where: { id, userId } });
  if (!rule) return fail("Aturan tidak ditemukan");

  await prisma.dailyBudget.update({
    where: { id },
    data: { targetAmount, isActive },
  });
  return done();
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const rule = await prisma.dailyBudget.findFirst({ where: { id, userId } });
  if (!rule) return fail("Aturan tidak ditemukan");

  await prisma.dailyBudget.delete({ where: { id } });
  return done();
}
