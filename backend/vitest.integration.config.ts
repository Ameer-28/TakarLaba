import { defineConfig } from "vitest/config";

const testDbUrl = process.env.TEST_DATABASE_URL;

const envVars: Record<string, string> = {
  LOG_LEVEL: "silent",
  DATABASE_URL: testDbUrl || "postgresql://dummy:dummy@localhost:5432/takarlaba_test",
  BETTER_AUTH_SECRET: "12345678901234567890123456789012",
  BETTER_AUTH_URL: "http://localhost:4000",
  FRONTEND_URL: "http://localhost:5173",
  NODE_ENV: "test",
};

if (testDbUrl) {
  envVars.TEST_DATABASE_URL = testDbUrl;
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/db/**/*.test.ts"],
    passWithNoTests: true,
    fileParallelism: false,
    env: envVars,
  },
});
