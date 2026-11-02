import { prisma, pool } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { seedDemo } from "./seed-demo.js";

export { DEMO_BUSINESS_ID } from "./fixture-data.js";
export {
  getDemoPassword,
  getDemoUsers,
  DEMO_USERS,
  seedV0,
  seedDemo,
  cleanDemoBusiness,
} from "./seed-demo.js";
export { generate30DaySales } from "./sales-generator.js";

export async function runCliSeed() {
  logger.info("Menjalankan Seed TakarLaba Fixture Deterministik...");
  await seedDemo();
  logger.info("Seed selesai dengan sukses.");
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.includes("seed")) {
  runCliSeed()
    .catch((err) => {
      logger.error({ err }, "Seed gagal dieksekusi");
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}
