import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sha256 } from "@/lib/auth/crypto";
import { createSession } from "@/lib/auth/session";
import { audit } from "@/lib/utils/audit";

export async function POST(req: Request) {
  const { email, code } = await req.json().catch(() => ({}));
  if (!email || !code) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const token = await prisma.verificationToken.findFirst({ where: { identifier: email.toLowerCase() }, orderBy: { createdAt: "desc" } });
  const now = new Date();
  if (!token || token.expiresAt < now || token.codeHash !== sha256(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  await prisma.verificationToken.delete({ where: { id: token.id } }).catch(()=>{});

  const user = await prisma.user.upsert({ where: { email: email.toLowerCase() }, update: {}, create: { email: email.toLowerCase(), name: email.split("@")[0] } });
  await createSession(user.id);
  await audit({ action: "auth.otp.verify", actorId: user.id });
  return NextResponse.json({ ok: true });
}
