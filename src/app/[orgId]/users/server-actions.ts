"use server";

import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { audit } from "@/lib/utils/audit";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { assertNotLastOwnerOnChange } from "@/lib/orgs/guards";

type AllowedRole = Extract<Role, "OWNER" | "CLIENT_ADMIN" | "CLIENT_USER">;

async function ensureAllow(orgId: string) {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  // Allow if member OWNER/CLIENT_ADMIN in this org OR owner impersonating this org
  const mem = await prisma.orgMembership.findFirst({ where: { orgId, userId: s.userId } });
  const allowed =
    mem?.role === "OWNER" ||
    mem?.role === "CLIENT_ADMIN" ||
    s.impersonatedOrgId === orgId;
  if (!allowed) throw new Error("FORBIDDEN");
  return { session: s, actorRole: mem?.role ?? null as AllowedRole | null };
}

function cleanEmail(e: unknown) {
  return String(e ?? "").trim().toLowerCase();
}

/** CLIENT_ADMIN cannot grant OWNER. OWNER can grant any role. */
function enforceGrantLimits(actorRole: AllowedRole | null, desired: AllowedRole) {
  if (actorRole === "CLIENT_ADMIN" && desired === "OWNER") {
    throw new Error("Client Admins cannot grant the Owner role.");
  }
}

export async function inviteUser(form: FormData) {
  const orgId = String(form.get("orgId") ?? "");
  const email = cleanEmail(form.get("email"));
  const role = (String(form.get("role") ?? "CLIENT_USER") as AllowedRole);

  if (!orgId || !email) throw new Error("Missing fields");
  const { session, actorRole } = await ensureAllow(orgId);
  enforceGrantLimits(actorRole, role);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: email.split("@")[0] },
  });

  // idempotent membership upsert; re-inviting updates role
  await prisma.orgMembership.upsert({
    where: { userId_orgId: { userId: user.id, orgId } },
    update: { role },
    create: { userId: user.id, orgId, role },
  });

  await audit({
    action: "org.user.invite",
    orgId,
    targetId: user.id,
    metadata: { email, role, actorId: session.userId, actorRole },
  });

  revalidatePath(`/${orgId}/users`);
}

export async function updateRole(form: FormData) {
  const orgId = String(form.get("orgId") ?? "");
  const userId = String(form.get("userId") ?? "");
  const role = (String(form.get("role") ?? "") as AllowedRole);

  if (!orgId || !userId || !role) throw new Error("Missing fields");
  const { session, actorRole } = await ensureAllow(orgId);
  enforceGrantLimits(actorRole, role);

  // last-owner guard if demoting from OWNER
  await assertNotLastOwnerOnChange({ orgId, userId, newRole: role });

  await prisma.orgMembership.update({
    where: { userId_orgId: { userId, orgId } },
    data: { role },
  });

  await audit({
    action: "org.user.role.update",
    orgId,
    targetId: userId,
    metadata: { role, actorId: session.userId, actorRole },
  });

  revalidatePath(`/${orgId}/users`);
}

export async function removeMember(form: FormData) {
  const orgId = String(form.get("orgId") ?? "");
  const userId = String(form.get("userId") ?? "");

  if (!orgId || !userId) throw new Error("Missing fields");
  const { session, actorRole } = await ensureAllow(orgId);

  // last-owner guard on removal
  await assertNotLastOwnerOnChange({ orgId, userId, removing: true });

  await prisma.orgMembership
    .delete({ where: { userId_orgId: { userId, orgId } } })
    .catch(() => {}); // idempotent

  await audit({
    action: "org.user.remove",
    orgId,
    targetId: userId,
    metadata: { actorId: session.userId, actorRole },
  });

  revalidatePath(`/${orgId}/users`);
}
