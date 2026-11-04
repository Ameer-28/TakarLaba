import { prisma } from "../lib/db.js";
import { Decimal } from "decimal.js";

export class MenuCostRepository {
  async getLatestCostPerBaseMap(
    businessId: string,
    ingredientIds: string[]
  ): Promise<Map<string, Decimal>> {
    if (ingredientIds.length === 0) return new Map();

    const batches = await prisma.stockBatch.findMany({
      where: {
        businessId,
        ingredientId: { in: ingredientIds },
        OR: [
          { purchaseId: null },
          {
            purchase: {
              OR: [{ note: null }, { NOT: { note: { startsWith: "[DIBATALKAN" } } }],
            },
          },
        ],
      },
      select: {
        ingredientId: true,
        costPerBase: true,
        receivedAt: true,
        createdAt: true,
        purchase: {
          select: {
            purchasedAt: true,
            createdAt: true,
          },
        },
      },
    });

    const map = new Map<string, Decimal>();
    const grouped = new Map<string, typeof batches>();

    for (const b of batches) {
      const list = grouped.get(b.ingredientId) ?? [];
      list.push(b);
      grouped.set(b.ingredientId, list);
    }

    for (const [ingId, bList] of grouped.entries()) {
      bList.sort((a, b) => {
        const aPurchasedAt = a.purchase?.purchasedAt ?? a.receivedAt ?? a.createdAt;
        const bPurchasedAt = b.purchase?.purchasedAt ?? b.receivedAt ?? b.createdAt;
        const diffPurchased = bPurchasedAt.getTime() - aPurchasedAt.getTime();
        if (diffPurchased !== 0) return diffPurchased;

        const aCreatedAt = a.purchase?.createdAt ?? a.createdAt;
        const bCreatedAt = b.purchase?.createdAt ?? b.createdAt;
        return bCreatedAt.getTime() - aCreatedAt.getTime();
      });

      const latest = bList[0];
      if (latest) {
        map.set(ingId, new Decimal(latest.costPerBase.toString()));
      }
    }

    return map;
  }

  async getValidStockBatches(businessId: string) {
    return prisma.stockBatch.findMany({
      where: {
        businessId,
        remainingQtyBase: { gt: 0 },
      },
      select: {
        ingredientId: true,
        remainingQtyBase: true,
        expiryDate: true,
      },
    });
  }
}
