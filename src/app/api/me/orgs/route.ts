import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  // All orgs the current user is a member of
  const memberships = await prisma.orgMembership.findMany({
    where: { userId: s.userId },
    include: { org: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ role: "asc" }, { org: { name: "asc" } }],
  });

  const orgs = memberships.map(m => ({
    id: m.org.id,
    name: m.org.name,
    slug: m.org.slug,
    role: m.role,
  }));

  // Is this user an OWNER anywhere? (enables "Main" + impersonation controls)
  const isOwner = memberships.some(m => m.role === "OWNER");

  return NextResponse.json({
    orgs,
    isOwner,
    impersonatedOrgId: s.impersonatedOrgId ?? null,
  });
}
