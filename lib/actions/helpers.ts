import "server-only";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user.id;
}

export async function getOrCreateTag(
  userId: string,
  name: string,
  kind: "INCOME" | "EXPENSE"
): Promise<{ id: string }> {
  const existing = await prisma.tag.findUnique({
    where: { userId_name: { userId, name } },
    select: { id: true },
  });
  if (existing) return existing;
  return prisma.tag.create({ data: { userId, name, kind }, select: { id: true } });
}

export type ActionResult = { ok: boolean; error?: string };

export function fail(error: string): ActionResult {
  return { ok: false, error };
}

export function done(): ActionResult {
  return { ok: true };
}
