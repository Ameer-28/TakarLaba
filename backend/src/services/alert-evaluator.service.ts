import { Decimal } from "decimal.js";
import type { AlertRepository } from "../repositories/alert.repo.js";
import type { MenuRepository } from "../repositories/menu.repo.js";
import type { SettingsRepository } from "../repositories/settings.repo.js";
import type { OverheadRepository } from "../repositories/overhead.repo.js";
import {
  buildOptionASnapshot,
  buildOptionBSnapshot,
  evaluateRecipeCosting,
} from "../domain/alert-snapshot.js";
import {
  buildAlertPayload,
  buildImpactedMenuAlertDto,
  type ImpactedMenuAlert,
} from "../dto/alert.dto.js";

type MenuWithRecipe = Awaited<ReturnType<MenuRepository["findActiveMenusUsingIngredient"]>>[number];

interface PurchaseEvalContext {
  businessId: string;
  purchaseId: string;
  costMap: Map<string, Decimal>;
  overheadPerPortion: Decimal;
  defaultTarget: Decimal;
  roundingStep: number;
}

export class AlertEvaluator {
  constructor(
    private readonly repo: AlertRepository,
    private readonly menuRepo: MenuRepository,
    private readonly settingsRepo: SettingsRepository,
    private readonly overheadRepo: OverheadRepository
  ) {}

  async getOverheadPerPortion(businessId: string): Promise<Decimal> {
    const [activeOverheadSum, business] = await Promise.all([
      this.overheadRepo.sumActiveMonthlyOverhead(businessId),
      this.settingsRepo.findById(businessId),
    ]);
    const expectedPortions =
      business && business.expectedMonthlyPortions > 0 ? business.expectedMonthlyPortions : 1;
    return activeOverheadSum.dividedBy(expectedPortions).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  async evaluatePurchaseAlerts(
    businessId: string,
    purchaseId: string,
    purchasedBatches: Array<{ ingredientId: string; costPerBase: Decimal }>,
    previousCostMap: Map<string, Decimal>
  ): Promise<ImpactedMenuAlert[]> {
    const eligibleIngredients = this.getEligibleIngredients(purchasedBatches, previousCostMap);
    if (eligibleIngredients.length === 0) return [];

    const [settings, overheadPerPortion] = await Promise.all([
      this.settingsRepo.findById(businessId),
      this.getOverheadPerPortion(businessId),
    ]);

    const { ingredientMenus, consolidatedCostMap } = await this.loadMenusAndConsolidatedCosts(
      businessId,
      eligibleIngredients
    );

    const ctx: PurchaseEvalContext = {
      businessId,
      purchaseId,
      costMap: consolidatedCostMap,
      overheadPerPortion,
      defaultTarget: settings?.targetMarginDefault ?? new Decimal(50),
      roundingStep: settings?.priceRoundingStep ?? 500,
    };

    const impactedAlerts: ImpactedMenuAlert[] = [];
    for (const item of eligibleIngredients) {
      const menus = ingredientMenus.get(item.ingredientId) ?? [];
      for (const menu of menus) {
        const alert = await this.evaluateSingleMenuPurchaseImpact(ctx, menu, item);
        if (alert) impactedAlerts.push(alert);
      }
    }

    return impactedAlerts;
  }

  private getEligibleIngredients(
    batches: Array<{ ingredientId: string; costPerBase: Decimal }>,
    previousCostMap: Map<string, Decimal>
  ) {
    const batchMap = new Map<string, Decimal>();
    for (const b of batches) batchMap.set(b.ingredientId, b.costPerBase);

    const eligible: Array<{ ingredientId: string; newCost: Decimal; prevCost: Decimal }> = [];
    for (const [ingredientId, newCost] of batchMap.entries()) {
      const prevCost = previousCostMap.get(ingredientId);
      if (prevCost !== undefined) eligible.push({ ingredientId, newCost, prevCost });
    }
    return eligible;
  }

  private async loadMenusAndConsolidatedCosts(
    businessId: string,
    eligibleIngredients: Array<{ ingredientId: string }>
  ) {
    const ingredientMenus = new Map<string, MenuWithRecipe[]>();
    const allUniqueIngredientIds = new Set<string>();

    for (const item of eligibleIngredients) {
      const menus = await this.menuRepo.findActiveMenusUsingIngredient(
        businessId,
        item.ingredientId
      );
      ingredientMenus.set(item.ingredientId, menus);
      for (const m of menus) {
        for (const r of m.recipeItems) allUniqueIngredientIds.add(r.ingredientId);
      }
    }

    const consolidatedCostMap =
      allUniqueIngredientIds.size > 0
        ? await this.menuRepo.getLatestCostPerBaseMap(
            businessId,
            Array.from(allUniqueIngredientIds)
          )
        : new Map<string, Decimal>();

    return { ingredientMenus, consolidatedCostMap };
  }

  private async evaluateSingleMenuPurchaseImpact(
    ctx: PurchaseEvalContext,
    menu: MenuWithRecipe,
    item: { ingredientId: string; newCost: Decimal; prevCost: Decimal }
  ): Promise<ImpactedMenuAlert | null> {
    const targetMargin = menu.targetMargin ? new Decimal(menu.targetMargin) : ctx.defaultTarget;
    const currentPrice = new Decimal(menu.sellingPrice);
    const triggerItem = menu.recipeItems.find((r) => r.ingredientId === item.ingredientId);
    if (!triggerItem) return null;

    const costingBefore = evaluateRecipeCosting({
      recipeItems: menu.recipeItems,
      costMap: ctx.costMap,
      costOverrides: new Map([[item.ingredientId, item.prevCost]]),
      overheadPerPortion: ctx.overheadPerPortion,
      sellingPrice: currentPrice,
      targetMarginPercent: targetMargin,
    });

    const costingAfter = evaluateRecipeCosting({
      recipeItems: menu.recipeItems,
      costMap: ctx.costMap,
      costOverrides: new Map([[item.ingredientId, item.newCost]]),
      overheadPerPortion: ctx.overheadPerPortion,
      sellingPrice: currentPrice,
      targetMarginPercent: targetMargin,
    });

    if (
      !costingAfter.isCostComplete ||
      costingAfter.hppPenuh === null ||
      costingAfter.marginPercent === null
    ) {
      return null;
    }

    const activeAlert = await this.repo.findActiveByMenuId(ctx.businessId, menu.id);
    if (costingAfter.marginPercent.lessThan(targetMargin)) {
      return this.persistDipAlert({
        ctx,
        menu,
        triggerItem,
        costingBefore,
        costingAfter,
        activeAlertId: activeAlert?.id,
        targetMargin,
        currentPrice,
        newCostPerBase: item.newCost,
      });
    }

    if (activeAlert) {
      await this.repo.resolve(
        activeAlert.id,
        "AUTO_RESOLVED",
        null,
        "Margin pulih secara otomatis setelah harga bahan baku turun (>= target margin)"
      );
    }
    return null;
  }

  private async persistDipAlert(params: {
    ctx: PurchaseEvalContext;
    menu: MenuWithRecipe;
    triggerItem: MenuWithRecipe["recipeItems"][number];
    costingBefore: ReturnType<typeof evaluateRecipeCosting>;
    costingAfter: ReturnType<typeof evaluateRecipeCosting>;
    activeAlertId?: string;
    targetMargin: Decimal;
    currentPrice: Decimal;
    newCostPerBase: Decimal;
  }): Promise<ImpactedMenuAlert> {
    const {
      ctx,
      menu,
      triggerItem,
      costingBefore,
      costingAfter,
      activeAlertId,
      targetMargin,
      currentPrice,
      newCostPerBase,
    } = params;

    const triggerIng = triggerItem.ingredient;
    const optA = buildOptionASnapshot(
      costingAfter.hppPenuh!,
      targetMargin,
      currentPrice,
      ctx.roundingStep
    );
    const optB = buildOptionBSnapshot({
      sellingPrice: currentPrice,
      targetMargin,
      hppPenuh: costingAfter.hppPenuh!,
      triggerIngredient: triggerIng,
      currentTakaran: triggerItem.qtyUsableBase,
      costPerBase: newCostPerBase,
    });

    const hppBahanBefore = costingBefore.hppBahan ?? costingAfter.hppBahan!;
    const hppPenuhBefore = costingBefore.hppPenuh ?? costingAfter.hppPenuh!;
    const marginBeforePct = costingBefore.marginPercent ?? costingAfter.marginPercent!;

    const alertPayload = buildAlertPayload({
      triggerPurchaseId: ctx.purchaseId,
      triggerIngredientId: triggerIng.id,
      hppBahanBefore,
      hppBahanAfter: costingAfter.hppBahan!,
      hppPenuhBefore,
      hppPenuhAfter: costingAfter.hppPenuh!,
      marginBeforePct,
      marginAfterPct: costingAfter.marginPercent!,
      targetMargin,
      currentPrice,
      recommendedPrice: optA.raw.recommendedPrice,
    });

    const alertRecord = activeAlertId
      ? await this.repo.update(activeAlertId, alertPayload)
      : await this.repo.create({ businessId: ctx.businessId, menuId: menu.id, ...alertPayload });

    return buildImpactedMenuAlertDto({
      alertId: alertRecord.id,
      menuId: menu.id,
      menuName: menu.name,
      triggerIngredientId: triggerIng.id,
      triggerIngredientName: triggerIng.name,
      hppBahanBefore,
      hppBahanAfter: costingAfter.hppBahan!,
      hppPenuhBefore,
      hppPenuhAfter: costingAfter.hppPenuh!,
      marginBeforePct,
      marginAfterPct: costingAfter.marginPercent!,
      targetMargin,
      currentPrice,
      optionA: optA.formatted,
      optionB: optB.formatted,
      status: alertRecord.status as "OPEN" | "ACKNOWLEDGED",
    });
  }

  async reevaluateAlertsForMenu(businessId: string, menuId: string) {
    const menu = await this.menuRepo.findById(businessId, menuId);
    if (!menu || !menu.isActive || !menu.recipeItems || menu.recipeItems.length === 0) return null;

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

    const costing = evaluateRecipeCosting({
      recipeItems: menu.recipeItems,
      costMap,
      overheadPerPortion,
      sellingPrice: currentPrice,
      targetMarginPercent: targetMargin,
    });

    const activeAlert = await this.repo.findActiveByMenuId(businessId, menuId);
    if (!costing.isCostComplete || costing.hppPenuh === null || costing.marginPercent === null) {
      return null;
    }

    if (costing.marginPercent.greaterThanOrEqualTo(targetMargin)) {
      if (!activeAlert) return null;
      return this.repo.resolve(
        activeAlert.id,
        "AUTO_RESOLVED",
        null,
        "Margin pulih secara otomatis (>= target margin)"
      );
    }

    const optA = buildOptionASnapshot(costing.hppPenuh, targetMargin, currentPrice, roundingStep);
    let highestCostIngId = menu.recipeItems[0]?.ingredientId;
    let maxCost = new Decimal(0);
    for (const item of costing.items) {
      if (item.subtotal && item.subtotal.greaterThan(maxCost)) {
        maxCost = item.subtotal;
        highestCostIngId = item.ingredientId;
      }
    }

    const alertPayload = buildAlertPayload({
      triggerIngredientId: highestCostIngId!,
      hppBahanBefore: costing.hppBahan!,
      hppBahanAfter: costing.hppBahan!,
      hppPenuhBefore: costing.hppPenuh,
      hppPenuhAfter: costing.hppPenuh,
      marginBeforePct: costing.marginPercent,
      marginAfterPct: costing.marginPercent,
      targetMargin,
      currentPrice,
      recommendedPrice: optA.raw.recommendedPrice,
      note: "Peringatan terpicu otomatis karena penyesuaian resep, harga jual, overhead, atau target margin",
    });

    if (activeAlert) return this.repo.update(activeAlert.id, alertPayload);
    return this.repo.create({ businessId, menuId, ...alertPayload });
  }

  async reevaluateAllAlertsForBusiness(businessId: string): Promise<void> {
    const activeMenuIds = await this.menuRepo.findAllActiveMenuIds(businessId);
    for (const menuId of activeMenuIds) {
      await this.reevaluateAlertsForMenu(businessId, menuId);
    }
  }
}
