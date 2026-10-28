import { z } from "zod";

export const createMenuSchema = z.object({
  name: z
    .string({ error: "Nama menu wajib diisi" })
    .trim()
    .min(2, { error: "Nama menu minimal 2 karakter" })
    .max(100, { error: "Nama menu maksimal 100 karakter" }),
  category: z
    .string()
    .trim()
    .max(50, { error: "Kategori maksimal 50 karakter" })
    .nullable()
    .optional(),
  sellingPrice: z.union([z.number(), z.string()], { error: "Harga jual wajib diisi" }).refine(
    (val) => {
      const num = typeof val === "number" ? val : parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 100_000_000;
    },
    { error: "Harga jual harus lebih besar dari 0 dan maksimal 100.000.000" }
  ),
  targetMargin: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (val === null || val === undefined || val === "") return true;
        const num = typeof val === "number" ? val : parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 95;
      },
      { error: "Target margin harus antara 0% dan 95%" }
    ),
  isActive: z.boolean().default(true),
});

export const updateMenuSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Nama menu minimal 2 karakter" })
    .max(100, { error: "Nama menu maksimal 100 karakter" })
    .optional(),
  category: z
    .string()
    .trim()
    .max(50, { error: "Kategori maksimal 50 karakter" })
    .nullable()
    .optional(),
  sellingPrice: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const num = typeof val === "number" ? val : parseFloat(val);
        return !isNaN(num) && num > 0 && num <= 100_000_000;
      },
      { error: "Harga jual harus lebih besar dari 0 dan maksimal 100.000.000" }
    )
    .optional(),
  targetMargin: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (val === null || val === undefined || val === "") return true;
        const num = typeof val === "number" ? val : parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 95;
      },
      { error: "Target margin harus antara 0% dan 95%" }
    ),
  isActive: z.boolean().optional(),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
