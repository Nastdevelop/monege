import "server-only";
import { prisma } from "@/lib/prisma";
import { startOfToday, endOfToday } from "@/lib/format";
import { SAVING_TAG } from "@/lib/constants";

export const SAVING_BUDGET_TAG = "Nabung";

const EXCLUDED_TAG_NAMES = [
  "Transfer",
  "Transfer Keluar",
  "Transfer Masuk",
];

export interface BudgetRuleStatus {
  id: string;
  kind: "income" | "expense" | "saving";
  tagName: string | null;
  targetAmount: number;
  actual: number;
  status: "REACHED" | "UNDER" | "OVER" | "OK";
}

async function getExcludedTagIds(userId: string): Promise<string[]> {
  const tags = await prisma.tag.findMany({
    where: { userId, name: { in: EXCLUDED_TAG_NAMES } },
    select: { id: true },
  });
  return tags.map((t) => t.id);
}

export async function getTodayRealization(userId: string) {
  const excludedIds = await getExcludedTagIds(userId);
  return prisma.transaction.groupBy({
    by: ["type"],
    where: {
      wallet: { userId },
      date: { gte: startOfToday(), lte: endOfToday() },
      ...(excludedIds.length > 0 ? { tagId: { notIn: excludedIds } } : {}),
    },
    _sum: { amount: true },
  });
}

export async function getBudgetStatuses(
  userId: string
): Promise<BudgetRuleStatus[]> {
  const rules = await prisma.dailyBudget.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });
  if (rules.length === 0) return [];

  const [tags, today, excludedIds] = await Promise.all([
    prisma.tag.findMany({ where: { userId } }),
    getTodayRealization(userId),
    getExcludedTagIds(userId),
  ]);
  const tagByName = new Map(tags.map((t) => [t.name, t]));
  const savingTagId = tagByName.get(SAVING_TAG)?.id ?? null;
  const incomeToday = Number(
    today.find((t) => t.type === "INCOME")?._sum.amount ?? 0
  );

  const expenseRows = await prisma.transaction.groupBy({
    by: ["tagId"],
    where: {
      wallet: { userId },
      type: "EXPENSE",
      date: { gte: startOfToday() },
      ...(excludedIds.length > 0 ? { tagId: { notIn: excludedIds } } : {}),
    },
    _sum: { amount: true },
  });
  const expenseByTag = new Map<string, number>();
  for (const row of expenseRows) {
    expenseByTag.set(row.tagId, Number(row._sum.amount ?? 0));
  }

  return rules.map((rule) => {
    const target = Number(rule.targetAmount);

    if (rule.type === "INCOME") {
      if (rule.tagName === SAVING_BUDGET_TAG) {
        const actual = savingTagId ? (expenseByTag.get(savingTagId) ?? 0) : 0;
        return {
          id: rule.id,
          kind: "saving" as const,
          tagName: SAVING_TAG,
          targetAmount: target,
          actual,
          status: actual >= target ? ("REACHED" as const) : ("UNDER" as const),
        };
      }
      return {
        id: rule.id,
        kind: "income" as const,
        tagName: null,
        targetAmount: target,
        actual: incomeToday,
        status: incomeToday >= target ? ("REACHED" as const) : ("UNDER" as const),
      };
    }

    const tagId = rule.tagName ? (tagByName.get(rule.tagName)?.id ?? null) : null;
    const actual = tagId ? (expenseByTag.get(tagId) ?? 0) : 0;
    return {
      id: rule.id,
      kind: "expense" as const,
      tagName: rule.tagName,
      targetAmount: target,
      actual,
      status: actual > target ? ("OVER" as const) : ("OK" as const),
    };
  });
}
