import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { getBudgetStatuses } from "@/lib/budget-status";
import {
  formatDateID,
  formatIDR,
  startOfToday,
  endOfToday,
} from "@/lib/format";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET belum diset" }, { status: 503 });
  }

  const url = new URL(request.url);
  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret");

  if (provided !== secret) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const results = { remindersSent: 0, budgetAlertsSent: 0 };

  const dueReminders = await prisma.billReminder.findMany({
    where: {
      isSent: false,
      remindAt: { lte: endOfToday() },
      bill: { isPaid: false },
    },
    include: { bill: true },
    take: 500,
  });

  for (const reminder of dueReminders) {
    await sendPushToUser(reminder.bill.userId, {
      type: "BILL_REMINDER",
      title: "Pengingat Tagihan",
      message: `${reminder.bill.title} (${formatIDR(Number(reminder.bill.amount))}) jatuh tempo ${formatDateID(reminder.bill.dueDate)}.`,
    });
    await prisma.billReminder.update({
      where: { id: reminder.id },
      data: { isSent: true },
    });
    results.remindersSent++;
  }

  const rulesByUser = await prisma.dailyBudget.groupBy({
    by: ["userId"],
    where: { isActive: true },
  });

  for (const group of rulesByUser) {
    const userId = group.userId;
    const statuses = await getBudgetStatuses(userId);

    for (const status of statuses) {
      if (status.status !== "OVER" && status.status !== "UNDER") continue;

      const label =
        status.kind === "income"
          ? "Pemasukan harian"
          : status.kind === "saving"
            ? "Target nabung harian"
            : `Pengeluaran tag "${status.tagName}"`;

      const dedupeKey = `[rule:${status.id}]`;
      const alreadySent = await prisma.notification.findFirst({
        where: {
          userId,
          createdAt: { gte: startOfToday() },
          message: { contains: dedupeKey },
        },
        select: { id: true },
      });
      if (alreadySent) continue;

      await sendPushToUser(userId, {
        type: status.status === "OVER" ? "BUDGET_OVER" : "BUDGET_UNDER",
        title:
          status.status === "OVER"
            ? "Budget Melebihi Batas"
            : "Belum Tercapai",
        message: `${label}: realisasi ${formatIDR(status.actual)} vs target ${formatIDR(status.targetAmount)}. ${dedupeKey}`,
      });
      results.budgetAlertsSent++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
