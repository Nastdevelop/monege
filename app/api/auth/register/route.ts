import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(1).max(60),
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email sudah terdaftar" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, passwordHash },
    });
    await tx.wallet.create({
      data: {
        userId: created.id,
        name: "Dompet",
        isDefault: true,
        balance: 0,
      },
    });
    return created;
  });

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    themePref: user.themePref,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
