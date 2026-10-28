import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/lib/db.js", () => ({
  prisma: {
    business: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
  pool: {
    end: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock("../../src/lib/auth.js", () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
      setPassword: vi.fn(),
      signInEmail: vi.fn(),
    },
  },
}));

import { prisma } from "../../src/lib/db.js";
import { auth } from "../../src/lib/auth.js";
import { seedV0, DEMO_BUSINESS_ID, DEMO_USERS } from "../../src/seed/index.js";

describe("Seed v0 Logic and User Association", () => {
  const originalEnv = process.env.DEMO_PASSWORD;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEMO_PASSWORD = "test-demo-password";
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DEMO_PASSWORD = originalEnv;
    } else {
      delete process.env.DEMO_PASSWORD;
    }
  });

  it("upserts demo business with isDemo=true and required business parameters", async () => {
    vi.mocked(prisma.business.upsert).mockResolvedValueOnce({
      id: DEMO_BUSINESS_ID,
      name: "Kopi Takar Laba (Demo)",
      isDemo: true,
      targetMarginDefault: 50.0 as unknown as import("@prisma/client/runtime/library").Decimal,
      expiryWarnDays: 3,
      priceRoundingStep: 500,
      expectedMonthlyPortions: 1000,
      wastePromoMinMargin: 10.0 as unknown as import("@prisma/client/runtime/library").Decimal,
      timezone: "Asia/Jakarta",
      createdAt: new Date(),
      demoResetAt: null,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(auth.api.signUpEmail)
      .mockResolvedValueOnce({
        user: { id: "user-owner-001", email: "owner@takarlaba.demo", name: "Demo Pemilik" },
      } as unknown as Awaited<ReturnType<typeof auth.api.signUpEmail>>)
      .mockResolvedValueOnce({
        user: { id: "user-cashier-001", email: "kasir@takarlaba.demo", name: "Demo Kasir" },
      } as unknown as Awaited<ReturnType<typeof auth.api.signUpEmail>>);

    vi.mocked(prisma.user.update).mockResolvedValue({} as unknown as import("@prisma/client").User);

    await seedV0();

    expect(prisma.business.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: DEMO_BUSINESS_ID },
        create: expect.objectContaining({
          isDemo: true,
          name: "Kopi Takar Laba (Demo)",
        }),
      })
    );

    // Verify both owner and cashier are signed up
    expect(auth.api.signUpEmail).toHaveBeenCalledTimes(2);
    expect(auth.api.signUpEmail).toHaveBeenCalledWith({
      body: expect.objectContaining({ email: "owner@takarlaba.demo" }),
    });
    expect(auth.api.signUpEmail).toHaveBeenCalledWith({
      body: expect.objectContaining({ email: "kasir@takarlaba.demo" }),
    });

    // Verify users are associated with the demo business
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-owner-001" },
      data: expect.objectContaining({
        businessId: DEMO_BUSINESS_ID,
        role: "OWNER",
        isActive: true,
      }),
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-cashier-001" },
      data: expect.objectContaining({
        businessId: DEMO_BUSINESS_ID,
        role: "CASHIER",
        isActive: true,
      }),
    });
  });

  it("cleans up existing demo users before recreating deterministically", async () => {
    vi.mocked(prisma.business.upsert).mockResolvedValueOnce({
      id: DEMO_BUSINESS_ID,
      name: "Kopi Takar Laba (Demo)",
      isDemo: true,
      targetMarginDefault: 50.0 as unknown as import("@prisma/client/runtime/library").Decimal,
      expiryWarnDays: 3,
      priceRoundingStep: 500,
      expectedMonthlyPortions: 1000,
      wastePromoMinMargin: 10.0 as unknown as import("@prisma/client/runtime/library").Decimal,
      timezone: "Asia/Jakarta",
      createdAt: new Date(),
      demoResetAt: null,
    });

    // Existing demo user found
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "old-user-001",
      businessId: DEMO_BUSINESS_ID,
    } as unknown as import("@prisma/client").User);

    vi.mocked(prisma.user.delete).mockResolvedValue({} as unknown as import("@prisma/client").User);
    vi.mocked(auth.api.signUpEmail).mockResolvedValue({
      user: { id: "new-user-001" },
    } as unknown as Awaited<ReturnType<typeof auth.api.signUpEmail>>);
    vi.mocked(prisma.user.update).mockResolvedValue({} as unknown as import("@prisma/client").User);

    await seedV0();

    expect(prisma.user.delete).toHaveBeenCalledTimes(DEMO_USERS.length);
  });
});
