import { Decimal } from "decimal.js";
import { dashboardRepository, DashboardRepository } from "../repositories/dashboard.repo.js";
import { menuRepository, MenuRepository } from "../repositories/menu.repo.js";
import { calculateMenuCapacity } from "../domain/capacity.js";
import { isExpired } from "../lib/date.js";
import {
  toCashierCapacityDto,
  toOwnerCapacityDto,
  type CashierCapacityMenuDto,
  type OwnerCapacityMenuDto,
} from "../dto/analytics.dto.js";

export class AnalyticsService {
  constructor(
    private readonly dashboardRepo: DashboardRepository = dashboardRepository,
    private readonly menuRepo: MenuRepository = menuRepository
  ) {}

  /**
   * Retrieves capacity and bottleneck calculation for all active menus (BR-08, FR-CAP-01).
   * Strips granular item breakdowns for CASHIER role to protect business details (Rule 7).
   */
  async getMenuCapacities(
    businessId: string,
    role: string
  ): Promise<Array<OwnerCapacityMenuDto | CashierCapacityMenuDto>> {
    const [menus, stockBatches] = await Promise.all([
      this.dashboardRepo.getActiveMenusWithRecipes(businessId),
      this.menuRepo.getValidStockBatches(businessId),
    ]);

    const availableStockMap = new Map<string, Decimal>();
    for (const batch of stockBatches) {
      if (!isExpired(batch.expiryDate)) {
        const remaining = new Decimal(batch.remainingQtyBase.toString());
        const current = availableStockMap.get(batch.ingredientId) ?? new Decimal(0);
        availableStockMap.set(batch.ingredientId, current.plus(remaining));
      }
    }

    return menus.map((menu) => {
      const capResult = calculateMenuCapacity(
        {
          menuId: menu.id,
          menuName: menu.name,
          recipeItems: menu.recipeItems.map((r) => ({
            ingredientId: r.ingredientId,
            ingredientName: r.ingredient.name,
            baseUnit: r.ingredient.baseUnit,
            qtyUsable: r.qtyUsableBase.toString(),
            yieldPercent: r.ingredient.yieldPercent.toString(),
          })),
        },
        availableStockMap
      );

      if (role === "CASHIER") {
        return toCashierCapacityDto(menu, capResult);
      }

      return toOwnerCapacityDto(menu, capResult);
    });
  }
}

export const analyticsService = new AnalyticsService();
