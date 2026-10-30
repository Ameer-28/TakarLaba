import { z } from "zod";

export const queryAlertSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]).optional(),
  menuId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const dismissAlertSchema = z.object({
  note: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

export type QueryAlertInput = z.infer<typeof queryAlertSchema>;
export type DismissAlertInput = z.infer<typeof dismissAlertSchema>;
