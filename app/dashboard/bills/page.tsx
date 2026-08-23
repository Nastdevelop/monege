import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { BillsManager } from "@/components/bill/bills-manager";

export const metadata = { title: "Tagihan — Monege" };

export default async function BillsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const bills = await prisma.bill.findMany({
    where: { userId: user.id },
    orderBy: { dueDate: "asc" },
    include: { reminders: { orderBy: { remindAt: "asc" } } },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Tagihan & Reminder</h1>
      <p className="mt-1 text-sm text-secondary">
        Atur pengingat custom supaya tidak ada tagihan terlewat.
      </p>
      <div className="mt-6">
        <BillsManager
          bills={bills.map((b) => ({
            id: b.id,
            title: b.title,
            amount: Number(b.amount),
            dueDate: b.dueDate.toISOString(),
            isPaid: b.isPaid,
            reminders: b.reminders.map((r) => ({
              id: r.id,
              remindAt: r.remindAt.toISOString(),
              isSent: r.isSent,
            })),
          }))}
        />
      </div>
    </div>
  );
}
