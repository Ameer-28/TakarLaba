import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Nama minimal 2 karakter" })
      .max(100, { error: "Nama maksimal 100 karakter" }),
    businessName: z
      .string()
      .trim()
      .min(2, { error: "Nama usaha kuliner minimal 2 karakter" })
      .max(100, { error: "Nama usaha kuliner maksimal 100 karakter" }),
    email: z
      .email({ error: "Format email tidak valid" })
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string()
      .min(8, { error: "Kata sandi minimal 8 karakter" })
      .max(100, { error: "Kata sandi maksimal 100 karakter" }),
    confirmPassword: z.string().min(1, { error: "Konfirmasi kata sandi wajib diisi" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
