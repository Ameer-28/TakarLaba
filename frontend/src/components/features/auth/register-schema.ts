import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Name must be at least 2 characters" })
      .max(100, { error: "Name must be at most 100 characters" }),
    businessName: z
      .string()
      .trim()
      .min(2, { error: "Business name must be at least 2 characters" })
      .max(100, { error: "Business name must be at most 100 characters" }),
    email: z.email({ error: "Invalid email format" }).transform((val) => val.toLowerCase().trim()),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" })
      .max(100, { error: "Password must be at most 100 characters" }),
    confirmPassword: z.string().min(1, { error: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
