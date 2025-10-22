import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { audit } from "@/lib/utils/audit";

export const dynamic = "force-dynamic";

function json(data: any, init?: ResponseInit) {
  // Always disable caching from this route
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return new NextResponse(JSON.stringify(data), {
    ...init,
    headers,
    status: init?.status ?? 200,
  });
}

export async function POST(req: Request) {
  try {
    const s = await getSession();
    if (!s) return json({ error: "UNAUTHENTICATED" }, { status: 401 });

    // Only OWNERs can impersonate
    const isOwner = await prisma.orgMembership.count({
      where: { userId: s.userId, role: "OWNER" },
    });
    if (isOwner === 0) return json({ error: "FORBIDDEN" }, { status: 403 });

    // Parse body (tolerant)
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const stop = !!body?.stop;
    const orgId: string | undefined =
      typeof body?.orgId === "string" && body.orgId.trim() ? body.orgId.trim() : undefined;

    // Stop impersonation
    if (stop) {
      // If already cleared, short-circuit
      if (!s.impersonatedOrgId) {
        return json({ ok: true, impersonatedOrgId: null });
      }
      await prisma.session.update({
        where: { id: (s as any).id }, // ensure your getSession sets s.id appropriately
        data: { impersonatedOrgId: null },
      });
      await audit({ action: "owner.impersonate.stop", actorId: s.userId });
      return json({ ok: true, impersonatedOrgId: null });
    }

    // Start/Change impersonation
    if (!orgId) return json({ error: "orgId required" }, { status: 400 });

    // No-op if the target is already active
    if (s.impersonatedOrgId === orgId) {
      return json({ ok: true, impersonatedOrgId: orgId });
    }

    // Validate org exists
    const exists = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });
    if (!exists) return json({ error: "Org not found" }, { status: 404 });

    // Persist on the session row (DB-backed sessions)
    await prisma.session.update({
      where: { id: (s as any).id }, // make sure s.id is the DB session id
      data: { impersonatedOrgId: orgId },
    });

    await audit({ action: "owner.impersonate.start", actorId: s.userId, orgId });

    return json({ ok: true, impersonatedOrgId: orgId });
  } catch (e: any) {
    // Avoid leaking internals
    return json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
