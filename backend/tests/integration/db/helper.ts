import { describe } from "vitest";
import { prisma, pool } from "../../../src/lib/db.js";

export const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);
export const isCI = Boolean(process.env.CI);

if (isCI && !hasTestDb) {
  throw new Error(
    "TEST_DATABASE_URL must be configured when running real database integration tests in CI"
  );
}

/**
 * Test suite wrapper that skips gracefully in local development when TEST_DATABASE_URL
 * is not configured, but runs in CI where TEST_DATABASE_URL is provided.
 */
export const describeDb = describe.skipIf(!hasTestDb);

/**
 * Creates an isolated test business.
 */
export async function createTestBusiness(prefix = "test") {
  const uniqueId = `biz-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return prisma.business.create({
    data: {
      id: uniqueId,
      name: `Test Business ${prefix}`,
    },
  });
}

/**
 * Creates an isolated test user within a business.
 */
export async function createTestUser(businessId: string, role = "OWNER") {
  const uniqueId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `${uniqueId}@example.test`;
  return prisma.user.create({
    data: {
      id: uniqueId,
      name: `User ${uniqueId}`,
      email,
      role,
      businessId,
    },
  });
}

/**
 * Cleans up created test businesses and all associated cascade records.
 */
export async function cleanupBusinesses(businessIds: string[]) {
  if (!hasTestDb || businessIds.length === 0) return;
  await prisma.business.deleteMany({
    where: {
      id: { in: businessIds },
    },
  });
}

/**
 * Disconnects Prisma client and ends pg pool cleanly after tests finish.
 */
export async function disconnectDb() {
  if (hasTestDb) {
    await prisma.$disconnect();
    await pool.end();
  }
}
