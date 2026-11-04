import { z } from "zod";

export const registerOwnerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Nama minimal 2 karakter" })
    .max(100, { error: "Nama maksimal 100 karakter" }),
  businessName: z
    .string()
    .trim()
    .min(2, { error: "Nama bisnis minimal 2 karakter" })
    .max(100, { error: "Nama bisnis maksimal 100 karakter" }),
  email: z
    .email({ error: "Format email tidak valid" })
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, { error: "Kata sandi minimal 8 karakter" })
    .max(100, { error: "Kata sandi maksimal 100 karakter" }),
});

export type RegisterOwnerInput = z.infer<typeof registerOwnerSchema>;
