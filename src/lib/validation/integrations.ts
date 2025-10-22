import { z } from "zod";
export const sheetIdPattern = /^[a-zA-Z0-9-_]{20,}$/;
export const SheetGidMapSchema = z.object({
  RECEPTIONIST: z.number().int().nonnegative(),
  AFTER_HOURS: z.number().int().nonnegative(),
  REVIEW_MANAGER: z.number().int().nonnegative(),
  REACTIVATION: z.number().int().nonnegative(),
  SPEED_TO_LEAD: z.number().int().nonnegative(),
  CART_RECOVERY: z.number().int().nonnegative(),
});
export const SaveSheetConfigInput = z.object({
  orgId: z.string().min(1),
  sheetId: z.string().regex(sheetIdPattern, "Invalid Sheet ID"),
  sheetGidMap: SheetGidMapSchema,
});
