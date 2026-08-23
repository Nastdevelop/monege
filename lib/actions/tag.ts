"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId, fail, done, type ActionResult } from "./helpers";
import { LIMITS, PROTECTED_TAGS } from "@/lib/constants";

export async function createTag(
  name: string,
  kind: "INCOME" | "EXPENSE"
): Promise<ActionResult & { id?: string }> {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (trimmed.length < LIMITS.tag.min || trimmed.length > LIMITS.tag.max)
    return fail(`Nama tag ${LIMITS.tag.min}-${LIMITS.tag.max} karakter`);
  if (!/^[a-zA-Z0-9\s\-&/.,']+$/.test(trimmed))
    return fail("Nama tag mengandung karakter tidak valid");

  const existing = await prisma.tag.findUnique({
    where: { userId_name: { userId, name: trimmed } },
  });
  if (existing) return fail("Tag sudah ada");

  const created = await prisma.tag.create({
    data: { userId, name: trimmed, kind },
    select: { id: true },
  });
  return { ok: true, id: created.id };
}

export async function renameTag(
  id: string,
  name: string
): Promise<ActionResult> {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (trimmed.length < LIMITS.tag.min || trimmed.length > LIMITS.tag.max)
    return fail(`Nama tag ${LIMITS.tag.min}-${LIMITS.tag.max} karakter`);
  if (!/^[a-zA-Z0-9\s\-&/.,']+$/.test(trimmed))
    return fail("Nama tag mengandung karakter tidak valid");

  const tag = await prisma.tag.findFirst({ where: { id, userId } });
  if (!tag) return fail("Tag tidak ditemukan");

  if (PROTECTED_TAGS.some((t) => t.name === tag.name))
    return fail("Tag sistem tidak bisa diubah");

  const duplicate = await prisma.tag.findUnique({
    where: { userId_name: { userId, name: trimmed } },
  });
  if (duplicate && duplicate.id !== id) return fail("Tag sudah ada");

  await prisma.tag.update({ where: { id }, data: { name: trimmed } });
  return done();
}

export async function updateTagKind(
  id: string,
  kind: "INCOME" | "EXPENSE"
): Promise<ActionResult> {
  const userId = await requireUserId();

  const tag = await prisma.tag.findFirst({
    where: { id, userId },
    include: { _count: { select: { transactions: true } } },
  });
  if (!tag) return fail("Tag tidak ditemukan");

  if (PROTECTED_TAGS.some((t) => t.name === tag.name))
    return fail("Tag sistem tidak bisa diubah");

  if (tag._count.transactions > 0)
    return fail("Jenis tidak bisa diubah karena tag sudah dipakai transaksi");

  await prisma.tag.update({ where: { id }, data: { kind } });
  return done();
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const tag = await prisma.tag.findFirst({
    where: { id, userId },
    include: { _count: { select: { transactions: true } } },
  });
  if (!tag) return fail("Tag tidak ditemukan");

  if (PROTECTED_TAGS.some((t) => t.name === tag.name))
    return fail("Tag sistem tidak bisa dihapus");

  if (tag._count.transactions > 0)
    return fail(`Tag dipakai ${tag._count.transactions} transaksi`);

  await prisma.tag.delete({ where: { id } });
  return done();
}
