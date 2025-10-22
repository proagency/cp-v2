import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ signedIn: false });
  const memberships = await prisma.orgMembership.findMany({ where: { userId: s.userId } });
  const isOwner = memberships.some((m) => m.role === "OWNER");
  const firstOrgId = memberships[0]?.orgId ?? null;
  return NextResponse.json({ signedIn: true, isOwner, firstOrgId, impersonatedOrgId: s.impersonatedOrgId });
}
