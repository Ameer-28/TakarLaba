import { z } from "zod";

export const exportSalesQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Format tanggal mulai harus YYYY-MM-DD" })
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Format tanggal akhir harus YYYY-MM-DD" })
    .optional(),
  status: z.enum(["ALL", "COMPLETED", "VOIDED"]).optional().default("ALL"),
});

export type ExportSalesQuery = z.infer<typeof exportSalesQuerySchema>;
