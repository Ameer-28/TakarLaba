import { z } from "zod";

export const menuEngineeringQuerySchema = z.object({
  days: z.coerce.number().int().positive().default(30),
});

export const wasteRadarQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(60).optional(),
});

export type MenuEngineeringQuery = z.infer<typeof menuEngineeringQuerySchema>;
export type WasteRadarQuery = z.infer<typeof wasteRadarQuerySchema>;
