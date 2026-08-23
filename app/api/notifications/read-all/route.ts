import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  return NextResponse.json({ ok: true });
}
