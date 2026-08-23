import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { userId: user.id, endpoint: parsed.data.endpoint },
  });

  return NextResponse.json({ ok: true });
}
