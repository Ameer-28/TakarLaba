import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/integration/db/**"],
    passWithNoTests: true,
    fileParallelism: false,
    env: {
      LOG_LEVEL: "silent",
      DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/takarlaba_test",
      BETTER_AUTH_SECRET: "12345678901234567890123456789012",
      BETTER_AUTH_URL: "http://localhost:4000",
      FRONTEND_URL: "http://localhost:5173",
    },
  },
});
