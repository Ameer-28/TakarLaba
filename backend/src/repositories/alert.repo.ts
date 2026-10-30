import { prisma } from "../lib/db.js";
import type { AlertStatus, AlertResolution } from "../generated/prisma/enums.js";
import { Decimal } from "decimal.js";

export interface CreateAlertData {
  businessId: string;
  menuId: string;
  triggerPurchaseId?: string | null;
  triggerIngredientId?: string | null;
  ingredientCostBefore: Decimal | string;
  ingredientCostAfter: Decimal | string;
  fullCostBefore: Decimal | string;
  fullCostAfter: Decimal | string;
  marginBeforePct: Decimal | string;
  marginAfterPct: Decimal | string;
  targetPct: Decimal | string;
  sellingPriceAtTrigger: Decimal | string;
  recommendedPrice: Decimal | string;
  note?: string | null;
}

export interface UpdateAlertData {
  triggerPurchaseId?: string | null;
  triggerIngredientId?: string | null;
  ingredientCostBefore?: Decimal | string;
  ingredientCostAfter?: Decimal | string;
  fullCostBefore?: Decimal | string;
  fullCostAfter?: Decimal | string;
  marginBeforePct?: Decimal | string;
  marginAfterPct?: Decimal | string;
  targetPct?: Decimal | string;
  sellingPriceAtTrigger?: Decimal | string;
  recommendedPrice?: Decimal | string;
  note?: string | null;
}

export interface AlertFilter {
  status?: AlertStatus;
  menuId?: string;
  skip?: number;
  take?: number;
}

export class AlertRepository {
  /**
   * Find active alert for a menu (status OPEN or ACKNOWLEDGED).
   * Enforces D-06: at most one active alert per menu.
   */
  async findActiveByMenuId(businessId: string, menuId: string) {
    return prisma.marginAlert.findFirst({
      where: {
        businessId,
        menuId,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
      include: {
        menu: {
          select: {
            id: true,
            name: true,
            sellingPrice: true,
            targetMargin: true,
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
    });
  }

  /**
   * Find all active alerts for a business.
   */
  async findActiveAlerts(businessId: string) {
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
            sellingPrice: true,
            targetMargin: true,
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
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create a new margin alert.
   */
  async create(data: CreateAlertData) {
    return prisma.marginAlert.create({
      data: {
        businessId: data.businessId,
        menuId: data.menuId,
        status: "OPEN",
        triggerPurchaseId: data.triggerPurchaseId ?? null,
        triggerIngredientId: data.triggerIngredientId ?? null,
        ingredientCostBefore: new Decimal(data.ingredientCostBefore).toFixed(6),
        ingredientCostAfter: new Decimal(data.ingredientCostAfter).toFixed(6),
        fullCostBefore: new Decimal(data.fullCostBefore).toFixed(2),
        fullCostAfter: new Decimal(data.fullCostAfter).toFixed(2),
        marginBeforePct: new Decimal(data.marginBeforePct).toFixed(2),
        marginAfterPct: new Decimal(data.marginAfterPct).toFixed(2),
        targetPct: new Decimal(data.targetPct).toFixed(2),
        sellingPriceAtTrigger: new Decimal(data.sellingPriceAtTrigger).toFixed(2),
        recommendedPrice: new Decimal(data.recommendedPrice).toFixed(2),
        note: data.note ?? null,
      },
      include: {
        menu: true,
        triggerIngredient: true,
      },
    });
  }

  /**
   * Update an existing margin alert.
   */
  async update(id: string, data: UpdateAlertData) {
    return prisma.marginAlert.update({
      where: { id },
      data: {
        ...(data.triggerPurchaseId !== undefined && { triggerPurchaseId: data.triggerPurchaseId }),
        ...(data.triggerIngredientId !== undefined && {
          triggerIngredientId: data.triggerIngredientId,
        }),
        ...(data.ingredientCostBefore !== undefined && {
          ingredientCostBefore: new Decimal(data.ingredientCostBefore).toFixed(6),
        }),
        ...(data.ingredientCostAfter !== undefined && {
          ingredientCostAfter: new Decimal(data.ingredientCostAfter).toFixed(6),
        }),
        ...(data.fullCostBefore !== undefined && {
          fullCostBefore: new Decimal(data.fullCostBefore).toFixed(2),
        }),
        ...(data.fullCostAfter !== undefined && {
          fullCostAfter: new Decimal(data.fullCostAfter).toFixed(2),
        }),
        ...(data.marginBeforePct !== undefined && {
          marginBeforePct: new Decimal(data.marginBeforePct).toFixed(2),
        }),
        ...(data.marginAfterPct !== undefined && {
          marginAfterPct: new Decimal(data.marginAfterPct).toFixed(2),
        }),
        ...(data.targetPct !== undefined && {
          targetPct: new Decimal(data.targetPct).toFixed(2),
        }),
        ...(data.sellingPriceAtTrigger !== undefined && {
          sellingPriceAtTrigger: new Decimal(data.sellingPriceAtTrigger).toFixed(2),
        }),
        ...(data.recommendedPrice !== undefined && {
          recommendedPrice: new Decimal(data.recommendedPrice).toFixed(2),
        }),
        ...(data.note !== undefined && { note: data.note }),
      },
      include: {
        menu: true,
        triggerIngredient: true,
      },
    });
  }

  /**
   * Resolve an alert.
   */
  async resolve(
    id: string,
    resolution: AlertResolution,
    resolvedById?: string | null,
    note?: string | null
  ) {
    return prisma.marginAlert.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution,
        resolvedAt: new Date(),
        resolvedById: resolvedById ?? null,
        ...(note !== undefined && { note }),
      },
      include: {
        menu: true,
        triggerIngredient: true,
      },
    });
  }

  /**
   * Acknowledge an open alert.
   */
  async acknowledge(id: string) {
    return prisma.marginAlert.update({
      where: { id },
      data: {
        status: "ACKNOWLEDGED",
      },
      include: {
        menu: true,
        triggerIngredient: true,
      },
    });
  }

  /**
   * Find an alert by ID within tenant.
   */
  async findById(businessId: string, id: string) {
    return prisma.marginAlert.findFirst({
      where: { id, businessId },
      include: {
        menu: {
          include: {
            recipeItems: {
              include: {
                ingredient: true,
              },
            },
          },
        },
        triggerIngredient: true,
        triggerPurchase: true,
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * List alerts with filters and pagination.
   */
  async findMany(businessId: string, filter?: AlertFilter) {
    const where: {
      businessId: string;
      status?: AlertStatus;
      menuId?: string;
    } = { businessId };

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.menuId) {
      where.menuId = filter.menuId;
    }

    const [items, total] = await Promise.all([
      prisma.marginAlert.findMany({
        where,
        skip: filter?.skip,
        take: filter?.take,
        orderBy: { createdAt: "desc" },
        include: {
          menu: {
            select: {
              id: true,
              name: true,
              sellingPrice: true,
              targetMargin: true,
            },
          },
          triggerIngredient: {
            select: {
              id: true,
              name: true,
              baseUnit: true,
            },
          },
          triggerPurchase: {
            select: {
              id: true,
              supplierName: true,
              purchasedAt: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.marginAlert.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Count active (OPEN) alerts.
   */
  async countOpen(businessId: string): Promise<number> {
    return prisma.marginAlert.count({
      where: {
        businessId,
        status: "OPEN",
      },
    });
  }
}

export const alertRepository = new AlertRepository();
