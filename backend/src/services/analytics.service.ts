import { Decimal } from "decimal.js";
import { dashboardRepository, DashboardRepository } from "../repositories/dashboard.repo.js";
import { menuRepository, MenuRepository } from "../repositories/menu.repo.js";
import { settingsRepository, SettingsRepository } from "../repositories/settings.repo.js";
import { overheadRepository, OverheadRepository } from "../repositories/overhead.repo.js";
import { calculateMenuCapacity } from "../domain/capacity.js";
import {
  calculateMenuEngineering,
  type MenuItemEngineeringInput,
} from "../domain/menu-engineering.js";
import { calculateRawNeeded } from "../domain/units.js";
import { isExpired, todayWIB, endOfTodayWIB } from "../lib/date.js";
import {
  toCashierCapacityDto,
  toOwnerCapacityDto,
  toMenuEngineeringDto,
  type CashierCapacityMenuDto,
  type OwnerCapacityMenuDto,
  type MenuEngineeringResponseDto,
} from "../dto/analytics.dto.js";

export class AnalyticsService {
  constructor(
    private readonly dashboardRepo: DashboardRepository = dashboardRepository,
    private readonly menuRepo: MenuRepository = menuRepository,
    private readonly settingsRepo: SettingsRepository = settingsRepository,
    private readonly overheadRepo: OverheadRepository = overheadRepository
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

  /**
   * Evaluates Menu Engineering matrix (Kasavana & Smith) for the tenant across a period (BR-10, FR-MEG-01).
   */
  async getMenuEngineering(businessId: string, days = 30): Promise<MenuEngineeringResponseDto> {
    const asOf = todayWIB();
    const startDate = new Date(asOf.getTime() - days * 24 * 60 * 60 * 1000);
    const endDate = endOfTodayWIB();

    const [menus, business, overheadSum, salesCount, menuSalesRaw, stockBatches] =
      await Promise.all([
        this.dashboardRepo.getActiveMenusWithRecipes(businessId),
        this.settingsRepo.findById(businessId),
        this.overheadRepo.sumActiveMonthlyOverhead(businessId),
        this.dashboardRepo.getCompletedSaleCount(businessId, startDate, endDate),
        this.dashboardRepo.getMenuSalesQuantities(businessId, startDate, endDate),
        this.menuRepo.getValidStockBatches(businessId),
      ]);

    const expectedPortions = business?.expectedMonthlyPortions ?? 1300;
    const priceRoundingStep = business?.priceRoundingStep ?? 500;
    const overheadPerPortion =
      expectedPortions > 0
        ? new Decimal(overheadSum.toString()).dividedBy(expectedPortions)
        : new Decimal(0);

    const allIngredientIds = Array.from(
      new Set(menus.flatMap((m) => m.recipeItems.map((r) => r.ingredientId)))
    );

    const costMap = await this.menuRepo.getLatestCostPerBaseMap(businessId, allIngredientIds);

    // Track which ingredients are used by which menus (to identify exclusive ingredients for DOG menus)
    const ingredientMenusMap = new Map<string, Set<string>>();
    for (const menu of menus) {
      for (const item of menu.recipeItems) {
        let set = ingredientMenusMap.get(item.ingredientId);
        if (!set) {
          set = new Set();
          ingredientMenusMap.set(item.ingredientId, set);
        }
        set.add(menu.id);
      }
    }

    // Precalculate total stock value per ingredient (for exclusive ingredient recommendation)
    const ingredientStockValueMap = new Map<string, Decimal>();
    for (const batch of stockBatches) {
      if (!isExpired(batch.expiryDate)) {
        const cost = costMap.get(batch.ingredientId) ?? new Decimal(0);
        const rem = new Decimal(batch.remainingQtyBase.toString());
        const current = ingredientStockValueMap.get(batch.ingredientId) ?? new Decimal(0);
        ingredientStockValueMap.set(batch.ingredientId, current.plus(rem.times(cost)));
      }
    }

    // Map sales portions per menuId
    const portionsSoldMap = new Map<string, number>();
    for (const row of menuSalesRaw) {
      portionsSoldMap.set(row.menuId, row._sum.qty ?? 0);
    }

    const menuInputs: MenuItemEngineeringInput[] = menus.map((m) => {
      let isCostComplete = true;
      let hppBahan = new Decimal(0);

      for (const item of m.recipeItems) {
        const cost = costMap.get(item.ingredientId);
        if (cost === undefined || cost === null) {
          isCostComplete = false;
        } else {
          const rawNeeded = calculateRawNeeded(
            item.qtyUsableBase.toString(),
            item.ingredient.yieldPercent.toString()
          );
          hppBahan = hppBahan.plus(rawNeeded.times(cost));
        }
      }

      const hppPenuh = isCostComplete ? hppBahan.plus(overheadPerPortion) : null;
      const portionsSold = portionsSoldMap.get(m.id) ?? 0;

      // Exclusive ingredients for this menu
      const exclusiveIngredientNames: string[] = [];
      let exclusiveIngredientStockValue = new Decimal(0);

      for (const item of m.recipeItems) {
        const menusUsing = ingredientMenusMap.get(item.ingredientId);
        if (menusUsing && menusUsing.size === 1) {
          exclusiveIngredientNames.push(item.ingredient.name);
          const stockVal = ingredientStockValueMap.get(item.ingredientId) ?? new Decimal(0);
          exclusiveIngredientStockValue = exclusiveIngredientStockValue.plus(stockVal);
        }
      }

      return {
        menuId: m.id,
        menuName: m.name,
        category: m.category,
        sellingPrice: m.sellingPrice.toString(),
        hppPenuh,
        portionsSold,
        createdAt: m.createdAt,
        hasRecipe: m.recipeItems.length > 0,
        isCostComplete,
        exclusiveIngredientNames,
        exclusiveIngredientStockValue,
      };
    });

    const result = calculateMenuEngineering(menuInputs, {
      days,
      totalTransactions: salesCount,
      priceRoundingStep,
      asOfDate: asOf,
    });

    return toMenuEngineeringDto(result);
  }
}

export const analyticsService = new AnalyticsService();
