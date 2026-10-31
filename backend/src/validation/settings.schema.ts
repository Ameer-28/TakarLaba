import { z } from "zod";
import { decimalInput } from "./decimal.js";

export const updateSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Nama usaha minimal 2 karakter" })
    .max(100, { error: "Nama usaha maksimal 100 karakter" })
    .optional(),
  targetMarginDefault: decimalInput({
    min: 0,
    max: 95,
    error: "Target margin default harus bernilai antara 0% dan 95%",
  }).optional(),
  priceRoundingStep: z
    .number({ error: "Step pembulatan harga harus berupa angka bulat positif" })
    .int({ error: "Step pembulatan harga harus berupa bilangan bulat" })
    .refine((val) => [1, 50, 100, 500, 1000].includes(val), {
      error: "Step pembulatan harga harus salah satu dari: 1, 50, 100, 500, 1000",
    })
    .optional(),
  expectedMonthlyPortions: z
    .number({ error: "Estimasi porsi bulanan harus berupa angka bulat positif" })
    .int({ error: "Estimasi porsi bulanan harus berupa bilangan bulat" })
    .min(1, { error: "Estimasi porsi bulanan minimal 1" })
    .max(1_000_000, { error: "Estimasi porsi bulanan maksimal 1.000.000" })
    .optional(),
  expiryWarnDays: z
    .number({ error: "Peringatan kedaluwarsa harus berupa angka hari" })
    .int({ error: "Peringatan kedaluwarsa harus berupa bilangan bulat" })
    .min(1, { error: "Peringatan kedaluwarsa minimal 1 hari" })
    .max(60, { error: "Peringatan kedaluwarsa maksimal 60 hari" })
    .optional(),
  wastePromoMinMargin: decimalInput({
    min: 0,
    max: 95,
    error: "Batas margin promo waste harus antara 0% dan 95%",
  }).optional(),
  timezone: z
    .string()
    .trim()
    .min(1, { error: "Zona waktu tidak boleh kosong" })
    .max(50, { error: "Zona waktu maksimal 50 karakter" })
    .optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
