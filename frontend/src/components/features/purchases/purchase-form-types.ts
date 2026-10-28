import { z } from "zod";

export const purchaseItemSchema = z.object({
  ingredientId: z.string().min(1, { error: "Pilih bahan baku" }),
  purchaseUnit: z.string().min(1, { error: "Satuan wajib diisi" }),
  purchaseQty: z
    .number({ error: "Jumlah wajib berupa angka" })
    .positive({ error: "Jumlah harus lebih dari 0" }),
  purchaseUnitPrice: z
    .number({ error: "Harga beli wajib berupa angka" })
    .positive({ error: "Harga beli harus lebih dari 0" }),
  expiryDate: z.string().optional(),
});

export const purchaseFormSchema = z.object({
  invoiceNumber: z.string().optional(),
  supplierName: z.string().optional(),
  purchasedAt: z.string().min(1, { error: "Tanggal belanja wajib diisi" }),
  items: z.array(purchaseItemSchema).min(1, { error: "Minimal harus ada 1 bahan dibeli" }),
});

export type PurchaseItemValues = z.infer<typeof purchaseItemSchema>;
export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;
