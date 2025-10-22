import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import { createHash } from "node:crypto";

export async function audit({ orgId, actorId, action, targetType, targetId, metadata }:{
  orgId?: string | null; actorId?: string | null; action: string; targetType?: string | null; targetId?: string | null; metadata?: unknown;
}) {
  const h = headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const ua = h.get("user-agent") || ""; const uaHash = createHash("sha256").update(ua).digest("hex");
  await prisma.auditLog.create({ data: { orgId: orgId ?? null, actorId: actorId ?? null, action, targetType: targetType ?? null, targetId: targetId ?? null, ip: ip ?? undefined, uaHash, metadata: metadata as any } });
}
