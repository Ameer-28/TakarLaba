import { z } from "zod";

export const menuEngineeringQuerySchema = z.object({
  days: z.coerce.number().int().positive().default(30),
});

export type MenuEngineeringQuery = z.infer<typeof menuEngineeringQuerySchema>;
