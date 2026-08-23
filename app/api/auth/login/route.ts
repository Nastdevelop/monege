import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid" },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Email atau password salah" },
      { status: 401 }
    );
  }

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
