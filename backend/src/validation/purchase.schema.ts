import { z } from "zod";
import { decimalInput } from "./decimal.js";

export const purchaseItemInputSchema = z.object({
  ingredientId: z.string().min(1, { error: "Bahan baku wajib dipilih" }),
  purchaseQty: decimalInput({
    positive: true,
    max: 1_000_000,
    error: "Jumlah beli harus berupa angka positif maksimal 1.000.000",
  }),
  purchaseUnit: z
    .string()
    .min(1, { error: "Satuan beli tidak boleh kosong" })
    .max(30, { error: "Satuan beli maksimal 30 karakter" }),
  purchaseUnitPrice: decimalInput({
    positive: true,
    error: "Harga satuan harus berupa angka positif",
  }),
  expiryDate: z.string().optional().nullable(),
});

export const createPurchaseSchema = z.object({
  purchasedAt: z.string().optional(),
  supplierName: z
    .string()
    .max(100, { error: "Nama supplier maksimal 100 karakter" })
    .optional()
    .nullable(),
  note: z.string().max(255, { error: "Catatan maksimal 255 karakter" }).optional().nullable(),
  items: z
    .array(purchaseItemInputSchema)
    .min(1, { error: "Nota belanja minimal harus berisi 1 baris bahan" })
    .max(30, { error: "Nota belanja maksimal 30 baris dalam satu transaksi" }),
});

export const queryPurchaseSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  supplier: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type PurchaseItemInput = z.infer<typeof purchaseItemInputSchema>;
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type QueryPurchaseInput = z.infer<typeof queryPurchaseSchema>;
