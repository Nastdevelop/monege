import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "Push belum dikonfigurasi" }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}
