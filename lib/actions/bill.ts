"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId, fail, done, type ActionResult } from "./helpers";
import { isValidAmount, LIMITS } from "@/lib/constants";
import { parseDateWIB } from "@/lib/format";

export async function createBill(
  title: string,
  amount: number,
  dueDate: string,
  remindDates: string[]
): Promise<ActionResult> {
  const userId = await requireUserId();
  const trimmed = title.trim();
  if (trimmed.length < LIMITS.title.min || trimmed.length > LIMITS.title.max)
    return fail(`Nama tagihan ${LIMITS.title.min}-${LIMITS.title.max} karakter`);
  if (!isValidAmount(amount)) return fail("Nominal tidak valid");

  const due = parseDateWIB(dueDate);
  if (Number.isNaN(due.getTime())) return fail("Tanggal jatuh tempo tidak valid");

  await prisma.$transaction(async (tx) => {
    const bill = await tx.bill.create({
      data: { userId, title: trimmed, amount, dueDate: due },
    });
    const validReminders = remindDates
      .map((d) => parseDateWIB(d))
      .filter((d) => !Number.isNaN(d.getTime()));
    if (validReminders.length > 0) {
      await tx.billReminder.createMany({
        data: validReminders.map((remindAt) => ({
          billId: bill.id,
          remindAt,
        })),
      });
    }
  });
  return done();
}

export async function updateBill(
  id: string,
  title: string,
  amount: number,
  dueDate: string,
  remindDates: string[]
): Promise<ActionResult> {
  const userId = await requireUserId();
  const trimmed = title.trim();
  if (trimmed.length < LIMITS.title.min || trimmed.length > LIMITS.title.max)
    return fail(`Nama tagihan ${LIMITS.title.min}-${LIMITS.title.max} karakter`);
  if (!isValidAmount(amount)) return fail("Nominal tidak valid");

  const due = parseDateWIB(dueDate);
  if (Number.isNaN(due.getTime())) return fail("Tanggal jatuh tempo tidak valid");

  const bill = await prisma.bill.findFirst({ where: { id, userId } });
  if (!bill) return fail("Tagihan tidak ditemukan");

  const validReminders = remindDates
    .map((d) => parseDateWIB(d))
    .filter((d) => !Number.isNaN(d.getTime()));

  await prisma.$transaction(async (tx) => {
    await tx.bill.update({
      where: { id },
      data: { title: trimmed, amount, dueDate: due },
    });
    await tx.billReminder.deleteMany({
      where: { billId: id, isSent: false },
    });
    if (validReminders.length > 0) {
      await tx.billReminder.createMany({
        data: validReminders.map((remindAt) => ({ billId: id, remindAt })),
      });
    }
  });
  return done();
}

export async function markBillPaid(id: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const bill = await prisma.bill.findFirst({
    where: { id, userId },
    include: { reminders: true },
  });
  if (!bill) return fail("Tagihan tidak ditemukan");
  if (bill.isPaid) return fail("Tagihan sudah lunas");

  await prisma.$transaction([
    prisma.bill.update({ where: { id }, data: { isPaid: true } }),
    ...bill.reminders
      .filter((r) => !r.isSent)
      .map((r) =>
        prisma.billReminder.update({ where: { id: r.id }, data: { isSent: true } })
      ),
  ]);
  return done();
}

export async function deleteBill(id: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const bill = await prisma.bill.findFirst({ where: { id, userId } });
  if (!bill) return fail("Tagihan tidak ditemukan");

  await prisma.$transaction(async (tx) => {
    await tx.billReminder.deleteMany({ where: { billId: id } });
    await tx.bill.delete({ where: { id } });
  });
  return done();
}
