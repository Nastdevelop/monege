"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function updateThemePref(
  theme: "DARK" | "SOFT_COLOR"
): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  if (!user) return { ok: false };
  await prisma.user.update({
    where: { id: user.id },
    data: { themePref: theme },
  });
  return { ok: true };
}
