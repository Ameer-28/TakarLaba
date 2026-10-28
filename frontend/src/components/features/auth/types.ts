import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Format email tidak valid" }),
  password: z.string().min(8, { error: "Kata sandi minimal 8 karakter" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
