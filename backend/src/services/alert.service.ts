import { Decimal } from "decimal.js";
import { alertRepository, AlertRepository, type AlertFilter } from "../repositories/alert.repo.js";
import { menuRepository, MenuRepository } from "../repositories/menu.repo.js";
import { settingsRepository, SettingsRepository } from "../repositories/settings.repo.js";
import { overheadRepository, OverheadRepository } from "../repositories/overhead.repo.js";
import { calculateMenuCosting, type RecipeItemCostInput } from "../domain/costing.js";
import { calculateOptionA, calculateOptionB } from "../domain/pricing.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";

export interface ImpactedMenuAlert {
  alertId: string;
  menuId: string;
  menuName: string;
  triggerIngredientId: string;
  triggerIngredientName: string;
  costBefore: {
    hppBahan: string;
    hppPenuh: string;
    marginPercent: string;
  };
  costAfter: {
    hppBahan: string;
    hppPenuh: string;
    marginPercent: string;
  };
  targetMarginPercent: string;
  sellingPrice: string;
  optionA: {
    recommendedPrice: string;
    projectedMarginPercent: string;
    projectedMarginKontribusi: string;
    priceIncrease: string;
  };
  optionB: {
    maxAllowableCost: string;
    costSavingNeeded: string;
    currentTakaran: string;
    reducedAmount: string;
    newTakaran: string;
    unit: string;
    reductionPercent: string;
    isFeasible: boolean;
    infeasibleReason?: string;
  };
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
}

export class AlertService {
  constructor(
    private readonly repo: AlertRepository = alertRepository,
    private readonly menuRepo: MenuRepository = menuRepository,
    private readonly settingsRepo: SettingsRepository = settingsRepository,
    private readonly overheadRepo: OverheadRepository = overheadRepository
  ) {}

  /**
   * Helper to compute active overhead per portion according to BR-04.
   */
  async getOverheadPerPortion(businessId: string): Promise<Decimal> {
    const [activeOverheadSum, business] = await Promise.all([
      this.overheadRepo.sumActiveMonthlyOverhead(businessId),
      this.settingsRepo.findById(businessId),
    ]);

    const expectedPortions =
      business && business.expectedMonthlyPortions > 0 ? business.expectedMonthlyPortions : 1;

    return activeOverheadSum.dividedBy(expectedPortions).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Evaluates Price Shock Impact immediately following a multi-row purchase (BR-05, BR-06, FR-PSI-01).
   *
   * For each purchased ingredient:
   * - If replacement cost changed, finds all active menus using that ingredient.
   * - Evaluates margin before and after.
   * - If after margin < target margin: creates or updates an OPEN alert with Option A and Option B.
   * - If after margin >= target margin and an active alert was open: auto-resolves it (AUTO_RESOLVED).
   */
  async evaluatePurchaseAlerts(
    businessId: string,
    purchaseId: string,
    purchasedBatches: Array<{ ingredientId: string; costPerBase: Decimal }>,
    previousCostMap: Map<string, Decimal>
  ): Promise<ImpactedMenuAlert[]> {
    const impactedAlerts: ImpactedMenuAlert[] = [];

    // Distinct ingredients from this purchase
    const ingredientBatchMap = new Map<string, Decimal>();
    for (const b of purchasedBatches) {
      // Use the latest batch cost for each ingredient
      ingredientBatchMap.set(b.ingredientId, b.costPerBase);
    }

    const [settings, overheadPerPortion] = await Promise.all([
      this.settingsRepo.findById(businessId),
      this.getOverheadPerPortion(businessId),
    ]);

    const defaultTarget = settings?.targetMarginDefault ?? new Decimal(50);
    const roundingStep = settings?.priceRoundingStep ?? 500;

    for (const [ingredientId, newCostPerBase] of ingredientBatchMap.entries()) {
      const prevCostPerBase = previousCostMap.get(ingredientId);

      // Edge case BR-05: First purchase of an ingredient has no previous price -> does not trigger alert
      if (prevCostPerBase === undefined) {
        continue;
      }

      // Find all active menus containing this ingredient in their recipe
      const menusWithIngredient = await this.menuRepo.findActiveMenusUsingIngredient(
        businessId,
        ingredientId
      );

      if (menusWithIngredient.length === 0) {
        continue;
      }

      // Collect all ingredient IDs across these menus to fetch latest replacement costs
      const allIngredientIds = new Set<string>();
      for (const m of menusWithIngredient) {
        for (const r of m.recipeItems) {
          allIngredientIds.add(r.ingredientId);
        }
      }

      const currentCostMap = await this.menuRepo.getLatestCostPerBaseMap(
        businessId,
        Array.from(allIngredientIds)
      );

      for (const menu of menusWithIngredient) {
        const targetMargin = menu.targetMargin ? new Decimal(menu.targetMargin) : defaultTarget;
        const currentPrice = new Decimal(menu.sellingPrice);

        // Build recipe cost inputs before and after
        const beforeInputs: RecipeItemCostInput[] = [];
        const afterInputs: RecipeItemCostInput[] = [];
        let triggerRecipeItem: (typeof menu.recipeItems)[number] | undefined;

        for (const r of menu.recipeItems) {
          const ing = r.ingredient;
          const qtyUsableBase = new Decimal(r.qtyUsableBase.toString());

          // Before cost: for the trigger ingredient use prevCostPerBase, for others use currentCostMap
          const costBefore =
            r.ingredientId === ingredientId
              ? prevCostPerBase
              : (currentCostMap.get(r.ingredientId) ?? null);

          // After cost: for the trigger ingredient use newCostPerBase, for others use currentCostMap
          const costAfter =
            r.ingredientId === ingredientId
              ? newCostPerBase
              : (currentCostMap.get(r.ingredientId) ?? null);

          if (r.ingredientId === ingredientId) {
            triggerRecipeItem = r;
          }

          beforeInputs.push({
            ingredientId: r.ingredientId,
            qtyUsable: qtyUsableBase,
            costPerBase: costBefore,
            yieldPercent: ing.yieldPercent,
          });

          afterInputs.push({
            ingredientId: r.ingredientId,
            qtyUsable: qtyUsableBase,
            costPerBase: costAfter,
            yieldPercent: ing.yieldPercent,
          });
        }

        const costingBefore = calculateMenuCosting({
          recipeItems: beforeInputs,
          overheadPerPortion,
          sellingPrice: currentPrice,
          targetMarginPercent: targetMargin,
        });

        const costingAfter = calculateMenuCosting({
          recipeItems: afterInputs,
          overheadPerPortion,
          sellingPrice: currentPrice,
          targetMarginPercent: targetMargin,
        });

        // Skip if cost is not complete
        if (
          !costingAfter.isCostComplete ||
          costingAfter.hppPenuh === null ||
          costingAfter.marginPercent === null ||
          !triggerRecipeItem
        ) {
          continue;
        }

        const triggerIng = triggerRecipeItem.ingredient;
        const activeAlert = await this.repo.findActiveByMenuId(businessId, menu.id);

        if (costingAfter.marginPercent.lessThan(targetMargin)) {
          // Margin dipped below target! Alert required.
          const optA = calculateOptionA(
            costingAfter.hppPenuh,
            targetMargin,
            currentPrice,
            roundingStep
          );

          const optB = calculateOptionB(currentPrice, targetMargin, costingAfter.hppPenuh, {
            id: triggerIng.id,
            name: triggerIng.name,
            currentTakaran: new Decimal(triggerRecipeItem.qtyUsableBase.toString()),
            unit: triggerIng.baseUnit,
            costPerBase: newCostPerBase,
            yieldPercent: triggerIng.yieldPercent,
          });

          let alertRecord;
          const hppBahanBefore = costingBefore.hppBahan ?? costingAfter.hppBahan!;
          const hppPenuhBefore = costingBefore.hppPenuh ?? costingAfter.hppPenuh;
          const marginBeforePct = costingBefore.marginPercent ?? costingAfter.marginPercent;

          if (activeAlert) {
            // Update existing active alert (D-06: at most one active alert per menu)
            alertRecord = await this.repo.update(activeAlert.id, {
              triggerPurchaseId: purchaseId,
              triggerIngredientId: ingredientId,
              ingredientCostBefore: hppBahanBefore,
              ingredientCostAfter: costingAfter.hppBahan!,
              fullCostBefore: hppPenuhBefore,
              fullCostAfter: costingAfter.hppPenuh,
              marginBeforePct,
              marginAfterPct: costingAfter.marginPercent,
              targetPct: targetMargin,
              sellingPriceAtTrigger: currentPrice,
              recommendedPrice: optA.recommendedPrice,
            });
          } else {
            // Create new OPEN alert
            alertRecord = await this.repo.create({
              businessId,
              menuId: menu.id,
              triggerPurchaseId: purchaseId,
              triggerIngredientId: ingredientId,
              ingredientCostBefore: hppBahanBefore,
              ingredientCostAfter: costingAfter.hppBahan!,
              fullCostBefore: hppPenuhBefore,
              fullCostAfter: costingAfter.hppPenuh,
              marginBeforePct,
              marginAfterPct: costingAfter.marginPercent,
              targetPct: targetMargin,
              sellingPriceAtTrigger: currentPrice,
              recommendedPrice: optA.recommendedPrice,
            });
          }

          impactedAlerts.push({
            alertId: alertRecord.id,
            menuId: menu.id,
            menuName: menu.name,
            triggerIngredientId: triggerIng.id,
            triggerIngredientName: triggerIng.name,
            costBefore: {
              hppBahan: hppBahanBefore.toFixed(2),
              hppPenuh: hppPenuhBefore.toFixed(2),
              marginPercent: marginBeforePct.toFixed(2),
            },
            costAfter: {
              hppBahan: costingAfter.hppBahan!.toFixed(2),
              hppPenuh: costingAfter.hppPenuh.toFixed(2),
              marginPercent: costingAfter.marginPercent.toFixed(2),
            },
            targetMarginPercent: targetMargin.toFixed(2),
            sellingPrice: currentPrice.toFixed(2),
            optionA: {
              recommendedPrice: optA.recommendedPrice.toFixed(2),
              projectedMarginPercent: optA.projectedMarginPercent.toFixed(2),
              projectedMarginKontribusi: optA.projectedMarginKontribusi.toFixed(2),
              priceIncrease: optA.priceIncrease.toFixed(2),
            },
            optionB: {
              maxAllowableCost: optB.maxAllowableCost.toFixed(2),
              costSavingNeeded: optB.costSavingNeeded.toFixed(2),
              currentTakaran: optB.currentTakaran.toFixed(3),
              reducedAmount: optB.reducedAmount.toFixed(3),
              newTakaran: optB.newTakaran.toFixed(3),
              unit: optB.unit,
              reductionPercent: optB.reductionPercent.toFixed(2),
              isFeasible: optB.isFeasible,
              infeasibleReason: optB.infeasibleReason,
            },
            status: alertRecord.status as "OPEN" | "ACKNOWLEDGED",
          });
        } else if (activeAlert) {
          // Margin recovered (e.g. ingredient price dropped)! Auto-resolve alert (BR-05)
          await this.repo.resolve(
            activeAlert.id,
            "AUTO_RESOLVED",
            null,
            "Margin pulih secara otomatis setelah harga bahan baku turun (>= target margin)"
          );
        }
      }
    }

    return impactedAlerts;
  }

  /**
   * Reevaluates margin alert status for a specific menu when its recipe, selling price,
   * overhead, or target margin changes (BR-05).
   */
  async reevaluateAlertsForMenu(businessId: string, menuId: string) {
    const menu = await this.menuRepo.findById(businessId, menuId);

    if (!menu || !menu.isActive || !menu.recipeItems || menu.recipeItems.length === 0) {
      return null;
    }

    const [settings, overheadPerPortion] = await Promise.all([
      this.settingsRepo.findById(businessId),
      this.getOverheadPerPortion(businessId),
    ]);

    const targetMargin = menu.targetMargin
      ? new Decimal(menu.targetMargin)
      : (settings?.targetMarginDefault ?? new Decimal(50));
    const roundingStep = settings?.priceRoundingStep ?? 500;
    const currentPrice = new Decimal(menu.sellingPrice);

    const ingredientIds = menu.recipeItems.map((r) => r.ingredientId);
    const costMap = await this.menuRepo.getLatestCostPerBaseMap(businessId, ingredientIds);

    const recipeCostInputs: RecipeItemCostInput[] = [];
    for (const r of menu.recipeItems) {
      recipeCostInputs.push({
        ingredientId: r.ingredientId,
        qtyUsable: new Decimal(r.qtyUsableBase),
        costPerBase: costMap.get(r.ingredientId) ?? null,
        yieldPercent: new Decimal(r.yieldPercent),
      });
    }

    const costing = calculateMenuCosting({
      recipeItems: recipeCostInputs,
      overheadPerPortion,
      sellingPrice: currentPrice,
      targetMarginPercent: targetMargin,
    });

    const activeAlert = await this.repo.findActiveByMenuId(businessId, menuId);

    // If costing cannot be fully computed, retain state
    if (!costing.isCostComplete || costing.hppPenuh === null || costing.marginPercent === null) {
      return null;
    }

    if (costing.marginPercent.greaterThanOrEqualTo(targetMargin)) {
      // Margin is safe (>= target). If alert was open/acknowledged, auto-resolve it!
      if (activeAlert) {
        return this.repo.resolve(
          activeAlert.id,
          "AUTO_RESOLVED",
          null,
          "Margin pulih secara otomatis (>= target margin)"
        );
      }
      return null;
    }

    // Margin is below target (< target).
    const optA = calculateOptionA(costing.hppPenuh, targetMargin, currentPrice, roundingStep);

    // Primary trigger ingredient = the highest cost contributor in recipe
    let highestCostIngId = menu.recipeItems[0]?.ingredientId;
    let maxCost = new Decimal(0);
    for (const item of costing.items) {
      if (item.subtotal && item.subtotal.greaterThan(maxCost)) {
        maxCost = item.subtotal;
        highestCostIngId = item.ingredientId;
      }
    }

    if (activeAlert) {
      // Update existing active alert
      return this.repo.update(activeAlert.id, {
        fullCostAfter: costing.hppPenuh,
        ingredientCostAfter: costing.hppBahan!,
        marginAfterPct: costing.marginPercent,
        sellingPriceAtTrigger: currentPrice,
        recommendedPrice: optA.recommendedPrice,
      });
    } else {
      // Create new OPEN alert
      return this.repo.create({
        businessId,
        menuId,
        triggerIngredientId: highestCostIngId,
        ingredientCostBefore: costing.hppBahan!,
        ingredientCostAfter: costing.hppBahan!,
        fullCostBefore: costing.hppPenuh,
        fullCostAfter: costing.hppPenuh,
        marginBeforePct: costing.marginPercent,
        marginAfterPct: costing.marginPercent,
        targetPct: targetMargin,
        sellingPriceAtTrigger: currentPrice,
        recommendedPrice: optA.recommendedPrice,
        note: "Peringatan terpicu otomatis karena penyesuaian resep, harga jual, overhead, atau target margin",
      });
    }
  }

  /**
   * Reevaluates all menus in the business when global overhead or settings change.
   */
  async reevaluateAllAlertsForBusiness(businessId: string): Promise<void> {
    const activeMenuIds = await this.menuRepo.findAllActiveMenuIds(businessId);

    for (const menuId of activeMenuIds) {
      await this.reevaluateAlertsForMenu(businessId, menuId);
    }
  }

  /**
   * Resolves an alert by applying Option A (Price Raised) to the menu.
   * Updates menu selling price, creates MenuPriceHistory with alert reference, and marks alert PRICE_RAISED.
   */
  async applyRecommendedPrice(businessId: string, alertId: string, userId: string) {
    const alert = await this.repo.findById(businessId, alertId);
    if (!alert) {
      throw new NotFoundError("Peringatan margin tidak ditemukan");
    }

    if (alert.status === "RESOLVED") {
      throw new ValidationError("Peringatan ini sudah diselesaikan sebelumnya");
    }

    const menu = await this.menuRepo.findById(businessId, alert.menuId);
    if (!menu) {
      throw new NotFoundError("Menu terkait tidak ditemukan");
    }

    const oldPrice = new Decimal(menu.sellingPrice);
    const newPrice = new Decimal(alert.recommendedPrice);

    // Update menu price with price history linked to this alert
    await this.menuRepo.update(
      businessId,
      menu.id,
      { sellingPrice: newPrice },
      {
        oldPrice,
        newPrice,
        reason: "PRICE_SHOCK_ALERT",
        changedById: userId,
        alertId: alert.id,
      }
    );

    // Resolve alert
    const resolvedAlert = await this.repo.resolve(
      alert.id,
      "PRICE_RAISED",
      userId,
      `Harga menu dinaikkan dari Rp${oldPrice.toNumber().toLocaleString("id-ID")} ke Rp${newPrice.toNumber().toLocaleString("id-ID")}`
    );

    // Reevaluate menu: margin will now be >= target
    await this.reevaluateAlertsForMenu(businessId, menu.id);

    return resolvedAlert;
  }

  /**
   * Dismisses an alert with an optional note (Owner choice to keep current price).
   */
  async dismissAlert(businessId: string, alertId: string, userId: string, note?: string) {
    const alert = await this.repo.findById(businessId, alertId);
    if (!alert) {
      throw new NotFoundError("Peringatan margin tidak ditemukan");
    }

    if (alert.status === "RESOLVED") {
      throw new ValidationError("Peringatan ini sudah diselesaikan sebelumnya");
    }

    return this.repo.resolve(
      alert.id,
      "DISMISSED",
      userId,
      note ?? "Peringatan diabaikan oleh pemilik usaha"
    );
  }

  /**
   * Acknowledges an open alert (shifts status to ACKNOWLEDGED).
   */
  async acknowledgeAlert(businessId: string, alertId: string) {
    const alert = await this.repo.findById(businessId, alertId);
    if (!alert) {
      throw new NotFoundError("Peringatan margin tidak ditemukan");
    }

    if (alert.status !== "OPEN") {
      throw new ValidationError("Hanya peringatan dengan status OPEN yang dapat di-acknowledge");
    }

    return this.repo.acknowledge(alert.id);
  }

  /**
   * List margin alerts for Pusat Peringatan with pagination and filter.
   */
  async listAlerts(businessId: string, filter?: AlertFilter) {
    const { items, total } = await this.repo.findMany(businessId, filter);

    const mappedItems = items.map((alert) => ({
      id: alert.id,
      businessId: alert.businessId,
      menuId: alert.menuId,
      menu: {
        id: alert.menu.id,
        name: alert.menu.name,
        sellingPrice: alert.menu.sellingPrice.toString(),
        targetMargin: alert.menu.targetMargin ? alert.menu.targetMargin.toString() : null,
      },
      status: alert.status,
      resolution: alert.resolution,
      note: alert.note,
      createdAt: alert.createdAt.toISOString(),
      resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
      resolvedBy: alert.resolvedBy
        ? { id: alert.resolvedBy.id, name: alert.resolvedBy.name }
        : null,
      triggerIngredient: alert.triggerIngredient
        ? {
            id: alert.triggerIngredient.id,
            name: alert.triggerIngredient.name,
            baseUnit: alert.triggerIngredient.baseUnit,
          }
        : null,
      triggerPurchase: alert.triggerPurchase
        ? {
            id: alert.triggerPurchase.id,
            supplierName: alert.triggerPurchase.supplierName,
            purchasedAt: alert.triggerPurchase.purchasedAt.toISOString(),
          }
        : null,
      ingredientCostBefore: new Decimal(alert.ingredientCostBefore).toFixed(2),
      ingredientCostAfter: new Decimal(alert.ingredientCostAfter).toFixed(2),
      fullCostBefore: new Decimal(alert.fullCostBefore).toFixed(2),
      fullCostAfter: new Decimal(alert.fullCostAfter).toFixed(2),
      marginBeforePct: new Decimal(alert.marginBeforePct).toFixed(2),
      marginAfterPct: new Decimal(alert.marginAfterPct).toFixed(2),
      targetPct: new Decimal(alert.targetPct).toFixed(2),
      sellingPriceAtTrigger: new Decimal(alert.sellingPriceAtTrigger).toFixed(2),
      recommendedPrice: new Decimal(alert.recommendedPrice).toFixed(2),
    }));

    return { items: mappedItems, total };
  }

  /**
   * Get alert detail with full menu recipe, trigger purchase info, and options A & B.
   */
  async getAlertById(businessId: string, id: string) {
    const alert = await this.repo.findById(businessId, id);
    if (!alert) {
      throw new NotFoundError("Peringatan margin tidak ditemukan");
    }

    const fullCostAfter = new Decimal(alert.fullCostAfter);
    const targetPct = new Decimal(alert.targetPct);
    const sellingPrice = new Decimal(alert.sellingPriceAtTrigger);
    const recommendedPrice = new Decimal(alert.recommendedPrice);
    const priceIncrease = recommendedPrice.minus(sellingPrice);
    const projectedMarginKontribusi = recommendedPrice.minus(fullCostAfter);
    const projectedMarginPercent = recommendedPrice.isZero()
      ? new Decimal(0)
      : projectedMarginKontribusi.dividedBy(recommendedPrice).times(100);

    const optionA = {
      recommendedPrice: recommendedPrice.toFixed(2),
      projectedMarginPercent: projectedMarginPercent.toFixed(2),
      projectedMarginKontribusi: projectedMarginKontribusi.toFixed(2),
      priceIncrease: priceIncrease.toFixed(2),
    };

    let optionB: {
      maxAllowableCost: string;
      costSavingNeeded: string;
      currentTakaran: string;
      reducedAmount: string;
      newTakaran: string;
      unit: string;
      reductionPercent: string;
      isFeasible: boolean;
      infeasibleReason?: string;
      projectedHppPenuh: string;
      projectedMarginPercent: string;
    } | null = null;

    if (alert.triggerIngredientId && alert.menu.recipeItems.length > 0) {
      const recipeItem = alert.menu.recipeItems.find(
        (r) => r.ingredientId === alert.triggerIngredientId
      );

      if (recipeItem) {
        const costMap = await this.menuRepo.getLatestCostPerBaseMap(businessId, [
          alert.triggerIngredientId,
        ]);
        const costPerBase = costMap.get(alert.triggerIngredientId) ?? new Decimal(0);

        const optB = calculateOptionB(sellingPrice, targetPct, fullCostAfter, {
          id: recipeItem.ingredient.id,
          name: recipeItem.ingredient.name,
          currentTakaran: new Decimal(recipeItem.qtyUsableBase),
          unit: recipeItem.ingredient.baseUnit,
          costPerBase,
          yieldPercent: recipeItem.ingredient.yieldPercent,
        });

        optionB = {
          maxAllowableCost: optB.maxAllowableCost.toFixed(2),
          costSavingNeeded: optB.costSavingNeeded.toFixed(2),
          currentTakaran: optB.currentTakaran.toFixed(3),
          reducedAmount: optB.reducedAmount.toFixed(3),
          newTakaran: optB.newTakaran.toFixed(3),
          unit: optB.unit,
          reductionPercent: optB.reductionPercent.toFixed(2),
          isFeasible: optB.isFeasible,
          infeasibleReason: optB.infeasibleReason,
          projectedHppPenuh: optB.projectedHppPenuh.toFixed(2),
          projectedMarginPercent: optB.projectedMarginPercent.toFixed(2),
        };
      }
    }

    return {
      id: alert.id,
      businessId: alert.businessId,
      menuId: alert.menuId,
      menuName: alert.menu.name,
      menuSellingPrice: alert.menu.sellingPrice.toString(),
      status: alert.status,
      resolution: alert.resolution,
      note: alert.note,
      createdAt: alert.createdAt.toISOString(),
      resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
      resolvedBy: alert.resolvedBy
        ? { id: alert.resolvedBy.id, name: alert.resolvedBy.name }
        : null,
      triggerPurchase: alert.triggerPurchase
        ? {
            id: alert.triggerPurchase.id,
            supplierName: alert.triggerPurchase.supplierName,
            purchasedAt: alert.triggerPurchase.purchasedAt.toISOString(),
          }
        : null,
      triggerIngredient: alert.triggerIngredient
        ? {
            id: alert.triggerIngredient.id,
            name: alert.triggerIngredient.name,
            baseUnit: alert.triggerIngredient.baseUnit,
          }
        : null,
      costs: {
        ingredientCostBefore: new Decimal(alert.ingredientCostBefore).toFixed(2),
        ingredientCostAfter: new Decimal(alert.ingredientCostAfter).toFixed(2),
        fullCostBefore: new Decimal(alert.fullCostBefore).toFixed(2),
        fullCostAfter: new Decimal(alert.fullCostAfter).toFixed(2),
        marginBeforePct: new Decimal(alert.marginBeforePct).toFixed(2),
        marginAfterPct: new Decimal(alert.marginAfterPct).toFixed(2),
        targetPct: new Decimal(alert.targetPct).toFixed(2),
        sellingPriceAtTrigger: new Decimal(alert.sellingPriceAtTrigger).toFixed(2),
      },
      optionA,
      optionB,
      recipe: alert.menu.recipeItems.map((r) => ({
        id: r.id,
        ingredientId: r.ingredientId,
        ingredientName: r.ingredient.name,
        amount: r.qtyUsableBase.toString(),
        unit: r.ingredient.baseUnit,
      })),
    };
  }
}

export const alertService = new AlertService();
