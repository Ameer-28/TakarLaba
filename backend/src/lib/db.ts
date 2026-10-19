import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

export async function checkPrismaConnection() {
  // Test query on Prisma client
  return await prisma.$queryRaw<Array<{ current_time: Date; database_name: string }>>`
    SELECT NOW() as current_time, current_database() as database_name
  `;
}
