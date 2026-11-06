import { z } from "zod";

export const purchaseItemSchema = z.object({
  ingredientId: z.string().min(1, { error: "Select an ingredient" }),
  purchaseUnit: z.string().min(1, { error: "Unit is required" }),
  purchaseQty: z
    .number({ error: "Quantity must be a number" })
    .positive({ error: "Quantity must be greater than 0" }),
  purchaseUnitPrice: z
    .number({ error: "Purchase price must be a number" })
    .positive({ error: "Purchase price must be greater than 0" }),
  expiryDate: z.string().optional(),
});

export const purchaseFormSchema = z.object({
  invoiceNumber: z.string().optional(),
  supplierName: z.string().optional(),
  purchasedAt: z.string().min(1, { error: "Purchase date is required" }),
  items: z.array(purchaseItemSchema).min(1, { error: "At least 1 item must be purchased" }),
});

export type PurchaseItemValues = z.infer<typeof purchaseItemSchema>;
export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;
