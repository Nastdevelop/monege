import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  await clearSessionCookie();
  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("application/json")) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }
  return NextResponse.json({ ok: true });
}
