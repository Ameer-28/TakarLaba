import { Decimal } from "decimal.js";
import { dashboardRepository, DashboardRepository } from "../repositories/dashboard.repo.js";
import { startOfDayWIB, endOfDayWIB, isExpired } from "../lib/date.js";
import { toMoney, toPercent } from "../lib/money.js";
import { calculateMenuCapacity } from "../domain/capacity.js";
import { NotFoundError } from "../lib/errors.js";

export interface DashboardSummaryResponse {
  summary: {
    omzet: string;
    transactionCount: number;
    estimatedProfit: string;
    averageMarginPercent: string;
    openAlertCount: number;
    expiringStockValue: string;
    lowStockCount: number;
    targetMargin: string;
    expiryWarnDays: number;
  };
  topAlerts: Array<{
    id: string;
    menuId: string;
    menuName: string;
    category: string | null;
    status: string;
    currentPrice: string;
    recommendedPrice: string;
    marginBeforePct: string;
    marginAfterPct: string;
    targetPct: string;
    ingredientCostBefore: string;
    ingredientCostAfter: string;
    fullCostBefore: string;
    fullCostAfter: string;
    createdAt: string;
  }>;
  lowestCapacityMenus: Array<{
    id: string;
    name: string;
    category: string | null;
    sellingPrice: string;
    capacity: number;
    hasRecipe: boolean;
    bottleneckIngredient: {
      id: string;
      name: string;
      remainingStock: string;
      unit: string;
    } | null;
  }>;
  recentSales: Array<{
    id: string;
    invoiceNo: string;
    soldAt: string;
    totalAmount: string;
    paymentMethod: string;
    cashierName: string;
    itemCount: number;
  }>;
  isNewBusiness: boolean;
}

export class DashboardService {
  constructor(private readonly repo: DashboardRepository = dashboardRepository) {}

  /**
   * Generates summary metrics, capacity alerts, and sales data for the Owner Dashboard (FR-DASH-01).
   */
  async getSummary(businessId: string): Promise<DashboardSummaryResponse> {
    const business = await this.repo.getBusinessSettings(businessId);
    if (!business) {
      throw new NotFoundError("Data profil bisnis tidak ditemukan");
    }

    const targetMarginDefault = new Decimal(business.targetMarginDefault.toString());
    const expiryWarnDays = business.expiryWarnDays;

    const startDate = startOfDayWIB();
    const endDate = endOfDayWIB();
    const thresholdDate = new Date(startDate);
    thresholdDate.setDate(thresholdDate.getDate() + expiryWarnDays);
    const thresholdEnd = endOfDayWIB(thresholdDate);

    const [
      salesAgg,
      recentSalesRaw,
      openAlertCount,
      topAlertsRaw,
      expiringBatches,
      ingredients,
      menus,
      counts,
    ] = await Promise.all([
      this.repo.getTodaySalesAggregate(businessId, startDate, endDate),
      this.repo.getRecentSales(businessId, startDate, endDate, 5),
      this.repo.getOpenAlertCount(businessId),
      this.repo.getTopAlerts(businessId, 5),
      this.repo.getExpiringBatches(businessId, thresholdEnd),
      this.repo.getActiveIngredientsWithBatches(businessId),
      this.repo.getActiveMenusWithRecipes(businessId),
      this.repo.getCounts(businessId),
    ]);

    const salesMetrics = this.computeSalesMetrics(salesAgg);
    const expiringStockValue = this.computeExpiringStockValue(expiringBatches);
    const { availableStockMap, lowStockCount } = this.computeStockLevels(ingredients);
    const lowestCapacityMenus = this.computeLowestCapacityMenus(menus, availableStockMap);
    const topAlerts = this.formatTopAlerts(topAlertsRaw);
    const recentSales = this.formatRecentSales(recentSalesRaw);

    const isNewBusiness =
      counts.saleCount === 0 && counts.menuCount === 0 && counts.ingredientCount === 0;

    return {
      summary: {
        omzet: salesMetrics.omzet.toFixed(2),
        transactionCount: salesMetrics.transactionCount,
        estimatedProfit: salesMetrics.estimatedProfit.toFixed(2),
        averageMarginPercent: salesMetrics.averageMarginPercent.toFixed(1),
        openAlertCount,
        expiringStockValue: expiringStockValue.toFixed(2),
        lowStockCount,
        targetMargin: toPercent(targetMarginDefault).toFixed(1),
        expiryWarnDays,
      },
      topAlerts,
      lowestCapacityMenus,
      recentSales,
      isNewBusiness,
    };
  }

  private computeSalesMetrics(
    salesAgg: Awaited<ReturnType<DashboardRepository["getTodaySalesAggregate"]>>
  ) {
    const omzet = toMoney(new Decimal(salesAgg._sum.totalAmount?.toString() ?? "0"));
    const totalIngredientCost = toMoney(
      new Decimal(salesAgg._sum.totalIngredientCost?.toString() ?? "0")
    );
    const totalOverhead = toMoney(new Decimal(salesAgg._sum.totalOverhead?.toString() ?? "0"));
    const transactionCount = salesAgg._count.id ?? 0;
    const estimatedProfit = toMoney(omzet.minus(totalIngredientCost).minus(totalOverhead));

    let averageMarginPercent = new Decimal(0);
    if (omzet.greaterThan(0)) {
      averageMarginPercent = toPercent(estimatedProfit.dividedBy(omzet).times(100));
    }

    return { omzet, transactionCount, estimatedProfit, averageMarginPercent };
  }

  private computeExpiringStockValue(
    batches: Awaited<ReturnType<DashboardRepository["getExpiringBatches"]>>
  ): Decimal {
    let total = new Decimal(0);
    for (const b of batches) {
      const remaining = new Decimal(b.remainingQtyBase.toString());
      const cost = new Decimal(b.costPerBase.toString());
      total = total.plus(remaining.times(cost));
    }
    return toMoney(total);
  }

  private computeStockLevels(
    ingredients: Awaited<ReturnType<DashboardRepository["getActiveIngredientsWithBatches"]>>
  ) {
    const availableStockMap = new Map<string, Decimal>();
    let lowStockCount = 0;

    for (const ing of ingredients) {
      let validStock = new Decimal(0);
      for (const b of ing.stockBatches) {
        if (!isExpired(b.expiryDate)) {
          validStock = validStock.plus(new Decimal(b.remainingQtyBase.toString()));
        }
      }
      availableStockMap.set(ing.id, validStock);
      if (validStock.lessThanOrEqualTo(new Decimal(ing.minStockBase.toString()))) {
        lowStockCount++;
      }
    }

    return { availableStockMap, lowStockCount };
  }

  private computeLowestCapacityMenus(
    menus: Awaited<ReturnType<DashboardRepository["getActiveMenusWithRecipes"]>>,
    availableStockMap: Map<string, Decimal>
  ): DashboardSummaryResponse["lowestCapacityMenus"] {
    const capacityList: DashboardSummaryResponse["lowestCapacityMenus"] = [];

    for (const menu of menus) {
      if (menu.recipeItems.length === 0) {
        capacityList.push({
          id: menu.id,
          name: menu.name,
          category: menu.category,
          sellingPrice: toMoney(new Decimal(menu.sellingPrice.toString())).toFixed(2),
          capacity: 0,
          hasRecipe: false,
          bottleneckIngredient: null,
        });
        continue;
      }

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

      capacityList.push({
        id: menu.id,
        name: menu.name,
        category: menu.category,
        sellingPrice: toMoney(new Decimal(menu.sellingPrice.toString())).toFixed(2),
        capacity: capResult.capacity,
        hasRecipe: true,
        bottleneckIngredient: capResult.bottleneck
          ? {
              id: capResult.bottleneck.ingredientId,
              name: capResult.bottleneck.ingredientName,
              remainingStock: capResult.bottleneck.validStockBase.toFixed(3),
              unit: capResult.bottleneck.baseUnit,
            }
          : null,
      });
    }

    capacityList.sort((a, b) => {
      if (a.capacity !== b.capacity) return a.capacity - b.capacity;
      return a.name.localeCompare(b.name);
    });

    return capacityList.slice(0, 5);
  }

  private formatTopAlerts(
    alerts: Awaited<ReturnType<DashboardRepository["getTopAlerts"]>>
  ): DashboardSummaryResponse["topAlerts"] {
    return alerts.map((a) => ({
      id: a.id,
      menuId: a.menuId,
      menuName: a.menu.name,
      category: a.menu.category,
      status: a.status,
      currentPrice: toMoney(new Decimal(a.sellingPriceAtTrigger.toString())).toFixed(2),
      recommendedPrice: toMoney(new Decimal(a.recommendedPrice.toString())).toFixed(2),
      marginBeforePct: toPercent(new Decimal(a.marginBeforePct.toString())).toFixed(1),
      marginAfterPct: toPercent(new Decimal(a.marginAfterPct.toString())).toFixed(1),
      targetPct: toPercent(new Decimal(a.targetPct.toString())).toFixed(1),
      ingredientCostBefore: toMoney(new Decimal(a.ingredientCostBefore.toString())).toFixed(2),
      ingredientCostAfter: toMoney(new Decimal(a.ingredientCostAfter.toString())).toFixed(2),
      fullCostBefore: toMoney(new Decimal(a.fullCostBefore.toString())).toFixed(2),
      fullCostAfter: toMoney(new Decimal(a.fullCostAfter.toString())).toFixed(2),
      createdAt: a.createdAt.toISOString(),
    }));
  }

  private formatRecentSales(
    sales: Awaited<ReturnType<DashboardRepository["getRecentSales"]>>
  ): DashboardSummaryResponse["recentSales"] {
    return sales.map((s) => ({
      id: s.id,
      invoiceNo: s.invoiceNo,
      soldAt: s.soldAt.toISOString(),
      totalAmount: toMoney(new Decimal(s.totalAmount.toString())).toFixed(2),
      paymentMethod: s.paymentMethod,
      cashierName: s.cashier?.name ?? "Kasir",
      itemCount: s.items.reduce((sum, item) => sum + item.qty, 0),
    }));
  }
}

export const dashboardService = new DashboardService();
