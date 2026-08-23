import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { BudgetManager } from "@/components/budget/budget-manager";
import { getBudgetStatuses, SAVING_BUDGET_TAG } from "@/lib/budget-status";

export const metadata = { title: "Budget Harian — Monege" };

export default async function BudgetPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [rules, statuses] = await Promise.all([
    prisma.dailyBudget.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    getBudgetStatuses(user.id),
  ]);

  const expenseTags = await prisma.tag.findMany({
    where: { userId: user.id, name: { notIn: ["Transfer"] } },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const tagNames = Array.from(
    new Set([...expenseTags.map((t) => t.name), SAVING_BUDGET_TAG])
  ).filter((n) => n !== "Tabungan");

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">Budget Harian</h1>
      <p className="mt-1 text-sm text-secondary">
        Target harian pemasukan, batas pengeluaran per tag, dan target nabung.
      </p>
      <div className="mt-6">
        <BudgetManager
          tags={tagNames}
          statuses={statuses}
          rules={rules.map((r) => ({
            id: r.id,
            kind:
              r.type === "INCOME"
                ? r.tagName === SAVING_BUDGET_TAG
                  ? ("saving" as const)
                  : ("income" as const)
                : ("expense" as const),
            tagName: r.tagName,
            targetAmount: Number(r.targetAmount),
            isActive: r.isActive,
          }))}
        />
      </div>
    </div>
  );
}
