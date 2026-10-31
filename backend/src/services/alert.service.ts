import { Decimal } from "decimal.js";
import { alertRepository, AlertRepository, type AlertFilter } from "../repositories/alert.repo.js";
import { menuRepository, MenuRepository } from "../repositories/menu.repo.js";
import { settingsRepository, SettingsRepository } from "../repositories/settings.repo.js";
import { overheadRepository, OverheadRepository } from "../repositories/overhead.repo.js";
import { AlertEvaluator } from "./alert-evaluator.service.js";
import { buildOptionBSnapshot } from "../domain/alert-snapshot.js";
import { mapAlertListItem, mapAlertDetail, type ImpactedMenuAlert } from "../dto/alert.dto.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";

export type { ImpactedMenuAlert } from "../dto/alert.dto.js";

export class AlertService {
  private readonly evaluator: AlertEvaluator;

  constructor(
    private readonly repo: AlertRepository = alertRepository,
    private readonly menuRepo: MenuRepository = menuRepository,
    private readonly settingsRepo: SettingsRepository = settingsRepository,
    private readonly overheadRepo: OverheadRepository = overheadRepository,
    evaluator?: AlertEvaluator
  ) {
    this.evaluator =
      evaluator ??
      new AlertEvaluator(this.repo, this.menuRepo, this.settingsRepo, this.overheadRepo);
  }

  /**
   * Helper to compute active overhead per portion according to BR-04.
   */
  async getOverheadPerPortion(businessId: string): Promise<Decimal> {
    return this.evaluator.getOverheadPerPortion(businessId);
  }

  /**
   * Evaluates Price Shock Impact immediately following a multi-row purchase (BR-05, BR-06, FR-PSI-01).
   */
  async evaluatePurchaseAlerts(
    businessId: string,
    purchaseId: string,
    purchasedBatches: Array<{ ingredientId: string; costPerBase: Decimal }>,
    previousCostMap: Map<string, Decimal>
  ): Promise<ImpactedMenuAlert[]> {
    return this.evaluator.evaluatePurchaseAlerts(
      businessId,
      purchaseId,
      purchasedBatches,
      previousCostMap
    );
  }

  /**
   * Reevaluates margin alert status for a specific menu when its recipe, selling price,
   * overhead, or target margin changes (BR-05).
   */
  async reevaluateAlertsForMenu(businessId: string, menuId: string) {
    return this.evaluator.reevaluateAlertsForMenu(businessId, menuId);
  }

  /**
   * Reevaluates all menus in the business when global overhead or settings change.
   */
  async reevaluateAllAlertsForBusiness(businessId: string): Promise<void> {
    return this.evaluator.reevaluateAllAlertsForBusiness(businessId);
  }

  /**
   * Resolves an alert by applying Option A (Price Raised) to the menu.
   */
  async applyRecommendedPrice(businessId: string, alertId: string, userId: string) {
    const alert = await this.repo.findById(businessId, alertId);
    if (!alert) throw new NotFoundError("Peringatan margin tidak ditemukan");
    if (alert.status === "RESOLVED") {
      throw new ValidationError("Peringatan ini sudah diselesaikan sebelumnya");
    }

    const menu = await this.menuRepo.findById(businessId, alert.menuId);
    if (!menu) throw new NotFoundError("Menu terkait tidak ditemukan");

    const oldPrice = new Decimal(menu.sellingPrice);
    const newPrice = new Decimal(alert.recommendedPrice);

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

    const resolvedAlert = await this.repo.resolve(
      alert.id,
      "PRICE_RAISED",
      userId,
      `Harga menu dinaikkan dari Rp${oldPrice.toNumber().toLocaleString("id-ID")} ke Rp${newPrice.toNumber().toLocaleString("id-ID")}`
    );

    await this.reevaluateAlertsForMenu(businessId, menu.id);
    return resolvedAlert;
  }

  /**
   * Dismisses an alert with an optional note (Owner choice to keep current price).
   */
  async dismissAlert(businessId: string, alertId: string, userId: string, note?: string) {
    const alert = await this.repo.findById(businessId, alertId);
    if (!alert) throw new NotFoundError("Peringatan margin tidak ditemukan");
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
    if (!alert) throw new NotFoundError("Peringatan margin tidak ditemukan");
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
    return { items: items.map(mapAlertListItem), total };
  }

  /**
   * Get alert detail with full menu recipe, trigger purchase info, and options A & B.
   */
  async getAlertById(businessId: string, id: string) {
    const alert = await this.repo.findById(businessId, id);
    if (!alert) throw new NotFoundError("Peringatan margin tidak ditemukan");

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

    let optionB = null;
    if (alert.triggerIngredientId && alert.menu.recipeItems.length > 0) {
      const recipeItem = alert.menu.recipeItems.find(
        (r) => r.ingredientId === alert.triggerIngredientId
      );
      if (recipeItem) {
        const costMap = await this.menuRepo.getLatestCostPerBaseMap(businessId, [
          alert.triggerIngredientId,
        ]);
        const costPerBase = costMap.get(alert.triggerIngredientId) ?? new Decimal(0);

        const optB = buildOptionBSnapshot({
          sellingPrice,
          targetMargin: targetPct,
          hppPenuh: fullCostAfter,
          triggerIngredient: recipeItem.ingredient,
          currentTakaran: recipeItem.qtyUsableBase,
          costPerBase,
        });
        optionB = optB.formatted;
      }
    }

    return mapAlertDetail(alert, optionA, optionB);
  }
}

export const alertService = new AlertService();
