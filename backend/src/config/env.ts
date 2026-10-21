import "./load-env.js";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  FRONTEND_URL: z.url(),
  DEMO_MODE: z.stringbool().default(false),
});

export type AppEnv = {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  DATABASE_URL: string;
  DIRECT_URL?: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  FRONTEND_URL: string;
  DEMO_MODE: boolean;
};

export function parseEnv(source: Record<string, string | undefined>): AppEnv {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const invalidKeys = Array.from(
      new Set(parsed.error.issues.map((issue) => issue.path.join(".")).filter(Boolean))
    );
    throw new Error(`Invalid environment variables: ${invalidKeys.join(", ")}`);
  }

  const data = parsed.data;
  return {
    NODE_ENV: data.NODE_ENV,
    PORT: data.PORT,
    DATABASE_URL: data.DATABASE_URL,
    DIRECT_URL: data.DIRECT_URL || data.DATABASE_URL_UNPOOLED || undefined,
    BETTER_AUTH_SECRET: data.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: data.BETTER_AUTH_URL,
    FRONTEND_URL: data.FRONTEND_URL,
    DEMO_MODE: data.DEMO_MODE,
  };
}

let loadedEnv: AppEnv;
try {
  loadedEnv = parseEnv(process.env);
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[FATAL] ${message}\n`);
  process.exit(1);
}

export const env = loadedEnv;
