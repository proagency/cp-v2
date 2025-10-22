"use server";
import { prisma } from "@/lib/prisma/client";
import { audit } from "@/lib/utils/audit";
import { revalidatePath } from "next/cache";
import { ModuleKey } from "@prisma/client";

export async function toggleModule(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "");
  const module = String(formData.get("module") ?? "") as ModuleKey;
  const enabled = String(formData.get("enabled") ?? "true") === "true";
  if (!orgId || !module) throw new Error("Missing fields");
  await prisma.orgModuleGrant.upsert({
    where: { orgId_module: { orgId, module } },
    update: { enabled },
    create: { orgId, module, enabled },
  });
  await audit({ action: "owner.module.toggle", orgId, metadata: { module, enabled } });
  revalidatePath("/(owner)/modules");
}
