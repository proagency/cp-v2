"use server";
import { prisma } from "@/lib/prisma/client";
import { audit } from "@/lib/utils/audit";
import { revalidatePath } from "next/cache";

export async function createOrg(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!name || !slug) throw new Error("Missing fields");
  const sheetId = "REPLACE_SHEET_ID";
  const map = { RECEPTIONIST:0, AFTER_HOURS:111111111, REVIEW_MANAGER:222222222, REACTIVATION:333333333, SPEED_TO_LEAD:444444444, CART_RECOVERY:555555555 };
  const org = await prisma.organization.create({ data: { name, slug, sheetId, sheetGidMap: map } });
  await audit({ action: "owner.org.create", targetId: org.id });
  revalidatePath("/(owner)/organizations");
}

export async function renameOrg(formData: FormData) {
  const id = String(formData.get("orgId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) throw new Error("Missing fields");
  await prisma.organization.update({ where: { id }, data: { name } });
  await audit({ action: "owner.org.rename", targetId: id, metadata: { name } });
  revalidatePath("/(owner)/organizations");
}
