"use server";
import { prisma } from "@/lib/prisma/client";
import { audit } from "@/lib/utils/audit";
import { revalidatePath } from "next/cache";
import { SaveSheetConfigInput, SheetGidMapSchema } from "@/lib/validation/integrations";

export async function saveSheetConfig(formData: FormData) {
  const input = {
    orgId: String(formData.get("orgId") ?? ""),
    sheetId: String(formData.get("sheetId") ?? ""),
    sheetGidMap: parseJson(String(formData.get("sheetGidMap") ?? "{}")),
  };
  const parsed = SaveSheetConfigInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map(i=>i.message).join(", "));
  const mapParsed = SheetGidMapSchema.safeParse(parsed.data.sheetGidMap);
  if (!mapParsed.success) throw new Error("GID map must include all 6 modules with numeric gids.");
  await prisma.organization.update({ where: { id: parsed.data.orgId }, data: { sheetId: parsed.data.sheetId, sheetGidMap: parsed.data.sheetGidMap } });
  await audit({ action: "owner.sheet.config.save", orgId: parsed.data.orgId });
  revalidatePath("/(owner)/integrations");
}
function parseJson(s) { try { return JSON.parse(s); } catch { return {}; } }
