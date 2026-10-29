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

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
