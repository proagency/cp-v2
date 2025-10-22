"use server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { audit } from "@/lib/utils/audit";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { assertNotLastOwnerOnChange } from "@/lib/orgs/guards";

async function ensureOwner() {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  const owner = await prisma.orgMembership.findFirst({ where: { userId: s.userId, role: "OWNER" } });
  if (!owner) throw new Error("FORBIDDEN");
  return s;
}

const cleanEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();

export async function createUser(form: FormData) {
  const s = await ensureOwner();
  const email = cleanEmail(form.get("email"));
  const name = String(form.get("name") ?? "").trim() || email.split("@")[0];
  if (!email) throw new Error("Email required");

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });

  await audit({ action: "owner.user.create", targetId: user.id, metadata: { email, actorId: s.userId } });
  revalidatePath("/(owner)/users");
}

export async function addMembership(form: FormData) {
  const s = await ensureOwner();
  const userId = String(form.get("userId") ?? "");
  const orgId = String(form.get("orgId") ?? "");
  const role = String(form.get("role") ?? "CLIENT_USER") as Role;
  if (!userId || !orgId) throw new Error("Missing fields");

  await prisma.orgMembership.upsert({
    where: { userId_orgId: { userId, orgId } },
    update: { role },
    create: { userId, orgId, role },
  });

  await audit({ action: "owner.membership.add", targetId: userId, orgId, metadata: { role, actorId: s.userId } });
  revalidatePath("/(owner)/users");
}

export async function updateMembership(form: FormData) {
  const s = await ensureOwner();
  const userId = String(form.get("userId") ?? "");
  const orgId = String(form.get("orgId") ?? "");
  const role = String(form.get("role") ?? "") as Role;
  if (!userId || !orgId || !role) throw new Error("Missing fields");

  // last-owner guard if demoting from OWNER
  await assertNotLastOwnerOnChange({ orgId, userId, newRole: role as any });

  await prisma.orgMembership.update({
    where: { userId_orgId: { userId, orgId } },
    data: { role },
  });

  await audit({ action: "owner.membership.update", targetId: userId, orgId, metadata: { role, actorId: s.userId } });
  revalidatePath("/(owner)/users");
}

export async function removeMembership(form: FormData) {
  const s = await ensureOwner();
  const userId = String(form.get("userId") ?? "");
  const orgId = String(form.get("orgId") ?? "");
  if (!userId || !orgId) throw new Error("Missing fields");

  // last-owner guard on removal
  await assertNotLastOwnerOnChange({ orgId, userId, removing: true });

  await prisma.orgMembership
    .delete({ where: { userId_orgId: { userId, orgId } } })
    .catch(() => {}); // idempotent

  await audit({ action: "owner.membership.remove", targetId: userId, orgId, metadata: { actorId: s.userId } });
  revalidatePath("/(owner)/users");
}
