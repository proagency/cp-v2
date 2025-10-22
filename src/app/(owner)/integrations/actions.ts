// src/app/(owner)/integrations/actions.ts
"use server";

import { prisma } from "@/lib/prisma/client";
import { audit } from "@/lib/utils/audit";
import { revalidatePath } from "next/cache";
import { SaveSheetConfigInput, SheetGidMapSchema } from "@/lib/validation/integrations";

type JsonRecord = Record<string, unknown>;

function parseJson<T = unknown>(s: string): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return {} as T;
  }
}

export async function saveSheetConfig(formData: FormData) {
  const rawMap = parseJson<JsonRecord>(String(formData.get("sheetGidMap") ?? "{}"));

  const input = {
    orgId: String(formData.get("orgId") ?? ""),
    sheetId: String(formData.get("sheetId") ?? ""),
    sheetGidMap: rawMap,
  };

  const parsed = SaveSheetConfigInput.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const mapParsed = SheetGidMapSchema.safeParse(parsed.data.sheetGidMap);
  if (!mapParsed.success) {
    throw new Error("GID map must include all 6 modules with numeric gids.");
  }

  await prisma.organization.update({
    where: { id: parsed.data.orgId },
    data: {
      sheetId: parsed.data.sheetId,
      sheetGidMap: mapParsed.data, // now strongly validated
    },
  });

  await audit({ action: "owner.sheet.config.save", orgId: parsed.data.orgId });

  revalidatePath("/(owner)/integrations");
}
