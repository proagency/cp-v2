import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sha256, randomSixDigit } from "@/lib/auth/crypto";
import { audit } from "@/lib/utils/audit";

const OTP_TTL_MIN = Number(process.env.OTP_TTL_MIN ?? 10);

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") return NextResponse.json({ error: "Email required" }, { status: 400 });

  const code = randomSixDigit();
  const codeHash = sha256(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000);

  await prisma.verificationToken.create({ data: { identifier: email.toLowerCase(), codeHash, expiresAt } });

  const webhook = process.env.WEBHOOK_EMAIL_URL;
  if (webhook) {
    await fetch(webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "otp", email, code }) }).catch(()=>{});
  }

  await audit({ action: "auth.otp.request", metadata: { email } });
  return NextResponse.json({ ok: true });
}
