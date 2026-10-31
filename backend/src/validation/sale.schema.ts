import { z } from "zod";

export const saleItemInputSchema = z.object({
  menuId: z.string({ error: "menuId wajib diisi" }).min(1, "menuId tidak boleh kosong"),
  qty: z
    .number({ error: "qty harus berupa angka" })
    .int("qty harus berupa bilangan bulat")
    .min(1, "qty minimal 1 porsi")
    .max(999, "qty maksimal 999 porsi"),
});

export const createSaleSchema = z.object({
  paymentMethod: z.enum(["CASH", "QRIS", "TRANSFER"], {
    error: "Metode pembayaran harus berupa CASH, QRIS, atau TRANSFER",
  }),
  items: z
    .array(saleItemInputSchema, { error: "Daftar item pesanan wajib diisi" })
    .min(1, "Keranjang pesanan tidak boleh kosong")
    .max(50, "Maksimal 50 menu per transaksi"),
});

export const querySaleSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["COMPLETED", "VOIDED"]).optional(),
  paymentMethod: z.enum(["CASH", "QRIS", "TRANSFER"]).optional(),
  cashierId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type QuerySaleInput = z.infer<typeof querySaleSchema>;
