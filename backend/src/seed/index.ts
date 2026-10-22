import { auth } from "../lib/auth.js";
import { prisma, pool } from "../lib/db.js";
import { logger } from "../lib/logger.js";

export const DEMO_BUSINESS_ID = "demo-business-001";

export const DEMO_USERS = [
  {
    email: "owner@takarlaba.demo",
    password: "password123",
    name: "Demo Pemilik",
    role: "OWNER" as const,
  },
  {
    email: "kasir@takarlaba.demo",
    password: "password123",
    name: "Demo Kasir",
    role: "CASHIER" as const,
  },
];

export async function seedV0() {
  logger.info("Menjalankan Seed v0 TakarLaba...");

  // 1. Upsert Demo Business (strictly scoped to isDemo=true, Rule 20)
  const business = await prisma.business.upsert({
    where: { id: DEMO_BUSINESS_ID },
    update: {
      name: "Kopi Takar Laba (Demo)",
      isDemo: true,
      targetMarginDefault: 50.0,
      expiryWarnDays: 3,
      priceRoundingStep: 500,
      expectedMonthlyPortions: 1000,
      wastePromoMinMargin: 10.0,
      timezone: "Asia/Jakarta",
    },
    create: {
      id: DEMO_BUSINESS_ID,
      name: "Kopi Takar Laba (Demo)",
      isDemo: true,
      targetMarginDefault: 50.0,
      expiryWarnDays: 3,
      priceRoundingStep: 500,
      expectedMonthlyPortions: 1000,
      wastePromoMinMargin: 10.0,
      timezone: "Asia/Jakarta",
    },
  });

  logger.info({ businessId: business.id }, "Bisnis demo berhasil disiapkan");

  // 2. Upsert Demo Users via Better Auth API
  for (const demoUser of DEMO_USERS) {
    const existingUser = await prisma.user.findUnique({
      where: { email: demoUser.email },
    });

    if (existingUser) {
      // If user exists and belongs to demo business (or unattached), remove to re-create with fresh password
      if (existingUser.businessId === business.id || !existingUser.businessId) {
        await prisma.user.delete({ where: { id: existingUser.id } });
        logger.info({ email: demoUser.email }, "Akun user demo lama dibersihkan");
      }
    }

    const created = await auth.api.signUpEmail({
      body: {
        email: demoUser.email,
        password: demoUser.password,
        name: demoUser.name,
      },
    });

    if (!created || !created.user) {
      throw new Error(`Gagal membuat akun Better Auth untuk ${demoUser.email}`);
    }
    const userId = created.user.id;
    logger.info({ email: demoUser.email }, "Akun user Better Auth berhasil dibuat");

    // Assign tenant businessId, role, and active status
    await prisma.user.update({
      where: { id: userId },
      data: {
        businessId: business.id,
        role: demoUser.role,
        name: demoUser.name,
        isActive: true,
        emailVerified: true,
      },
    });

    logger.info(
      { email: demoUser.email, role: demoUser.role, businessId: business.id },
      "User demo berhasil dihubungkan ke bisnis demo"
    );
  }

  logger.info(
    "Seed v0 selesai: Bisnis Demo dan Akun Pemilik (owner@takarlaba.demo) & Kasir (kasir@takarlaba.demo) siap digunakan."
  );
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.includes("seed")) {
  seedV0()
    .catch((err) => {
      logger.error({ err }, "Seed v0 gagal");
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}
