import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const owner = await prisma.orgMembership.findFirst({
    where: { userId: s.userId, role: "OWNER" },
  });
  if (!owner) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    orgs,
    impersonatedOrgId: s.impersonatedOrgId ?? null,
  });
}
