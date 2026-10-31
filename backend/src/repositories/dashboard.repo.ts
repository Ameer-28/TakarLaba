import { prisma } from "../lib/db.js";

export class DashboardRepository {
  /**
   * Retrieves today's sales aggregate (omzet, ingredient cost, overhead, count)
   */
  async getTodaySalesAggregate(businessId: string, startDate: Date, endDate: Date) {
    return prisma.sale.aggregate({
      where: {
        businessId,
        status: "COMPLETED",
        soldAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
        totalIngredientCost: true,
        totalOverhead: true,
      },
      _count: {
        id: true,
      },
    });
  }

  /**
   * Retrieves recent sales transactions for today
   */
  async getRecentSales(businessId: string, startDate: Date, endDate: Date, limit = 5) {
    return prisma.sale.findMany({
      where: {
        businessId,
        status: "COMPLETED",
        soldAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          select: {
            qty: true,
          },
        },
      },
      orderBy: {
        soldAt: "desc",
      },
      take: limit,
    });
  }

  /**
   * Count OPEN margin alerts
   */
  async getOpenAlertCount(businessId: string): Promise<number> {
    return prisma.marginAlert.count({
      where: {
        businessId,
        status: "OPEN",
      },
    });
  }

  /**
   * Retrieves top active margin alerts (OPEN first, then ACKNOWLEDGED)
   */
  async getTopAlerts(businessId: string, limit = 5) {
    return prisma.marginAlert.findMany({
      where: {
        businessId,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
      include: {
        menu: {
          select: {
            id: true,
            name: true,
            category: true,
            sellingPrice: true,
          },
        },
        triggerIngredient: {
          select: {
            id: true,
            name: true,
            baseUnit: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
  }

  /**
   * Retrieves stock batches expiring on or before maxExpiryDate
   */
  async getExpiringBatches(businessId: string, maxExpiryDate: Date) {
    return prisma.stockBatch.findMany({
      where: {
        businessId,
        remainingQtyBase: { gt: 0 },
        expiryDate: {
          not: null,
          lte: maxExpiryDate,
        },
      },
      select: {
        id: true,
        remainingQtyBase: true,
        costPerBase: true,
        expiryDate: true,
      },
    });
  }

  /**
   * Retrieves active ingredients with their non-empty batches for stock & capacity calculation
   */
  async getActiveIngredientsWithBatches(businessId: string) {
    return prisma.ingredient.findMany({
      where: {
        businessId,
        isActive: true,
      },
      include: {
        stockBatches: {
          where: {
            remainingQtyBase: { gt: 0 },
          },
          select: {
            id: true,
            remainingQtyBase: true,
            costPerBase: true,
            expiryDate: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Retrieves active menus with their recipes for capacity calculation
   */
  async getActiveMenusWithRecipes(businessId: string) {
    return prisma.menu.findMany({
      where: {
        businessId,
        isActive: true,
      },
      include: {
        recipeItems: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                baseUnit: true,
                yieldPercent: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Retrieves business settings (target margin, expiry warning days, rounding step)
   */
  async getBusinessSettings(businessId: string) {
    return prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        targetMarginDefault: true,
        expiryWarnDays: true,
        priceRoundingStep: true,
      },
    });
  }

  /**
   * Check total counts for new business detection
   */
  async getCounts(businessId: string) {
    const [menuCount, ingredientCount, saleCount] = await Promise.all([
      prisma.menu.count({ where: { businessId, isActive: true } }),
      prisma.ingredient.count({ where: { businessId, isActive: true } }),
      prisma.sale.count({ where: { businessId } }),
    ]);

    return {
      menuCount,
      ingredientCount,
      saleCount,
    };
  }
}

export const dashboardRepository = new DashboardRepository();
