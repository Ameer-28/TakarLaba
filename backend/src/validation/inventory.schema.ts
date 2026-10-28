import { z } from "zod";

export const stockSummaryQuerySchema = z.object({
  warnDays: z.coerce.number().int().min(0).max(30).default(3),
});

export type StockSummaryQuery = z.infer<typeof stockSummaryQuerySchema>;

export const inventoryBatchesQuerySchema = z.object({
  warnDays: z.coerce.number().int().min(0).max(30).default(3),
  ingredientId: z.string().min(1).optional(),
  hasRemainingOnly: z.stringbool().optional().default(true),
});

export type InventoryBatchesQuery = z.infer<typeof inventoryBatchesQuerySchema>;
