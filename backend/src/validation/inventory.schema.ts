import { z } from "zod";
import { decimalInput } from "./decimal.js";

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

export const recordWasteSchema = z.object({
  batchId: z.string().min(1, { error: "Batch bahan baku wajib dipilih" }),
  qty: decimalInput({
    positive: true,
    max: 1_000_000,
    error: "Jumlah bahan terbuang harus berupa angka positif maksimal 1.000.000",
  }),
  unit: z.string().max(30, { error: "Satuan maksimal 30 karakter" }).optional(),
  reason: z
    .string()
    .min(3, { error: "Alasan pembuangan minimal 3 karakter" })
    .max(255, { error: "Alasan pembuangan maksimal 255 karakter" }),
  wasteDate: z.string().optional(),
});

export type RecordWasteInput = z.infer<typeof recordWasteSchema>;

export const wasteQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

export type WasteQuery = z.infer<typeof wasteQuerySchema>;

export const recordAdjustmentSchema = z.object({
  batchId: z.string().min(1, { error: "Batch bahan baku wajib dipilih" }),
  actualQty: decimalInput({
    nonNegative: true,
    max: 1_000_000,
    error: "Jumlah stok fisik harus berupa angka non-negatif maksimal 1.000.000",
  }),
  unit: z.string().max(30, { error: "Satuan maksimal 30 karakter" }).optional(),
  reason: z
    .string()
    .min(3, { error: "Alasan penyesuaian minimal 3 karakter" })
    .max(255, { error: "Alasan penyesuaian maksimal 255 karakter" }),
  adjustmentDate: z.string().optional(),
});

export type RecordAdjustmentInput = z.infer<typeof recordAdjustmentSchema>;

export const adjustmentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

export type AdjustmentQuery = z.infer<typeof adjustmentQuerySchema>;
