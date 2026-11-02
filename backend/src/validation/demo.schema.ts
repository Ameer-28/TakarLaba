import { z } from "zod";

export const demoLoginSchema = z.object({
  role: z.enum(["OWNER", "CASHIER"]),
});

export type DemoLoginInput = z.infer<typeof demoLoginSchema>;
