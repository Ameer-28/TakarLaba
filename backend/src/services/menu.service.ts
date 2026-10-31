import { menuRepository, MenuRepository, type MenuFilter } from "../repositories/menu.repo.js";
import { ingredientRepository, IngredientRepository } from "../repositories/ingredient.repo.js";
import { settingsRepository, SettingsRepository } from "../repositories/settings.repo.js";
import { overheadRepository, OverheadRepository } from "../repositories/overhead.repo.js";
import { normalizeNameKey, toBaseQuantity } from "../domain/units.js";
import { calculateMenuCosting } from "../domain/costing.js";
import { calculateMenuCapacity } from "../domain/capacity.js";
import { isExpired } from "../lib/date.js";
import { alertService, AlertService } from "./alert.service.js";
import { MenuCostService } from "./menu-cost.service.js";
import { ConflictError, NotFoundError, ValidationError } from "../lib/errors.js";
import { Decimal } from "decimal.js";
import type { CreateMenuInput, UpdateMenuInput } from "../validation/menu.schema.js";
import type { PreviewCostInput, SaveRecipeInput } from "../validation/recipe.schema.js";
import type { PosMenuItemDto } from "../dto/pos.dto.js";

export type { PosMenuItemDto };

export class MenuService {
  private costService: MenuCostService;

  constructor(
    private repo: MenuRepository = menuRepository,
    private ingredientRepo: IngredientRepository = ingredientRepository,
    private settingsRepo: SettingsRepository = settingsRepository,
    private overheadRepo: OverheadRepository = overheadRepository,
    private alerts: AlertService = alertService,
    costService?: MenuCostService
  ) {
    this.costService =
      costService ??
      new MenuCostService(this.repo, this.ingredientRepo, this.settingsRepo, this.overheadRepo);
  }

  async listMenus(businessId: string, filter?: MenuFilter) {
    const menus = await this.repo.findMany(businessId, filter);

    const allIngredientIds = Array.from(
      new Set(menus.flatMap((m) => m.recipeItems?.map((r) => r.ingredientId) ?? []))
    );

    let costMap = new Map<string, Decimal>();
    let overheadPerPortion = new Decimal(0);
    let defaultTargetMargin = new Decimal(50);

    if (allIngredientIds.length > 0) {
      const [loadedCostMap, loadedOverhead, loadedTarget] = await Promise.all([
        this.repo.getLatestCostPerBaseMap(businessId, allIngredientIds),
        this.getOverheadPerPortion(businessId),
        this.getDefaultTargetMargin(businessId),
      ]);
      costMap = loadedCostMap;
      overheadPerPortion = loadedOverhead;
      defaultTargetMargin = loadedTarget;
    }

    return menus.map((m) =>
      this.mapMenuCostSummary(m, costMap, overheadPerPortion, defaultTargetMargin)
    );
  }

  private mapMenuCostSummary(
    m: Awaited<ReturnType<MenuRepository["findMany"]>>[number],
    costMap: Map<string, Decimal>,
    overheadPerPortion: Decimal,
    defaultTargetMargin: Decimal
  ) {
    if (!m.hasRecipe || !m.recipeItems || m.recipeItems.length === 0) {
      return { ...m, costSummary: null };
    }

    const targetMargin = m.targetMargin ? new Decimal(m.targetMargin) : defaultTargetMargin;
    const recipeCostInputs = m.recipeItems.map((r) => ({
      ingredientId: r.ingredientId,
      qtyUsable: new Decimal(r.qtyUsableBase),
      costPerBase: costMap.get(r.ingredientId) ?? null,
      yieldPercent: r.ingredient.yieldPercent,
    }));

    const costing = calculateMenuCosting({
      recipeItems: recipeCostInputs,
      overheadPerPortion,
      sellingPrice: new Decimal(m.sellingPrice),
      targetMarginPercent: targetMargin,
    });

    const missingCostIngredients = m.recipeItems
      .filter((r) => !costMap.has(r.ingredientId))
      .map((r) => r.ingredient.name);

    return {
      ...m,
      costSummary: {
        hppBahan: costing.hppBahan ? costing.hppBahan.toFixed(2) : null,
        overheadPerPortion: costing.overheadPerPortion.toFixed(2),
        hppPenuh: costing.hppPenuh ? costing.hppPenuh.toFixed(2) : null,
        sellingPrice: costing.sellingPrice.toFixed(2),
        marginKontribusi: costing.marginKontribusi ? costing.marginKontribusi.toFixed(2) : null,
        marginPercent: costing.marginPercent ? costing.marginPercent.toFixed(2) : null,
        marginBahanPercent: costing.marginBahanPercent
          ? costing.marginBahanPercent.toFixed(2)
          : null,
        marginStatus: costing.marginStatus,
        isCostComplete: costing.isCostComplete,
        missingCostIngredients,
      },
    };
  }

  async getMenuById(businessId: string, id: string) {
    const item = await this.repo.findById(businessId, id);
    if (!item) throw new NotFoundError("Menu tidak ditemukan");
    return item;
  }

  async createMenu(businessId: string, input: CreateMenuInput) {
    const nameKey = normalizeNameKey(input.name);

    const existing = await this.repo.findByNameKey(businessId, nameKey);
    if (existing) {
      throw new ConflictError(
        `Menu dengan nama "${input.name}" sudah terdaftar dalam sistem usaha Anda`
      );
    }

    return this.repo.create(businessId, {
      name: input.name.trim(),
      nameKey,
      category: input.category ? input.category.trim() : null,
      sellingPrice: input.sellingPrice,
      targetMargin: input.targetMargin ?? null,
      isActive: input.isActive ?? true,
    });
  }

  private computePriceHistory(
    existingPrice: string,
    inputPrice: string | number | undefined,
    userId: string
  ) {
    if (inputPrice === undefined) return undefined;
    const oldPriceDec = new Decimal(existingPrice);
    const newPriceDec = new Decimal(inputPrice.toString());
    if (!oldPriceDec.equals(newPriceDec)) {
      return {
        oldPrice: existingPrice,
        newPrice: newPriceDec.toFixed(2),
        reason: "MANUAL" as const,
        changedById: userId,
      };
    }
    return undefined;
  }

  async updateMenu(businessId: string, id: string, input: UpdateMenuInput, userId: string) {
    const existing = await this.repo.findById(businessId, id);
    if (!existing) {
      throw new NotFoundError("Menu tidak ditemukan");
    }

    let nameKey: string | undefined;
    if (input.name) {
      nameKey = normalizeNameKey(input.name);
      if (nameKey !== existing.nameKey) {
        const duplicate = await this.repo.findByNameKey(businessId, nameKey);
        if (duplicate && duplicate.id !== id) {
          throw new ConflictError(
            `Menu dengan nama "${input.name}" sudah terdaftar dalam sistem usaha Anda`
          );
        }
      }
    }

    const priceHistory = this.computePriceHistory(
      existing.sellingPrice,
      input.sellingPrice,
      userId
    );

    const updated = await this.repo.update(
      businessId,
      id,
      {
        name: input.name ? input.name.trim() : undefined,
        nameKey,
        category:
          input.category !== undefined
            ? input.category
              ? input.category.trim()
              : null
            : undefined,
        sellingPrice: input.sellingPrice,
        targetMargin: input.targetMargin,
        isActive: input.isActive,
      },
      priceHistory
    );

    if (
      input.sellingPrice !== undefined ||
      input.targetMargin !== undefined ||
      input.isActive !== undefined
    ) {
      await this.alerts.reevaluateAlertsForMenu(businessId, id);
    }

    return updated;
  }

  async deleteMenu(businessId: string, id: string) {
    const existing = await this.repo.findById(businessId, id);
    if (!existing) throw new NotFoundError("Menu tidak ditemukan");

    const salesCount = await this.repo.countSales(businessId, id);
    if (salesCount > 0) {
      throw new ConflictError(
        "Menu sudah memiliki riwayat transaksi penjualan. Anda dapat menonaktifkannya alih-alih menghapusnya."
      );
    }

    return this.repo.delete(businessId, id);
  }

  async toggleActive(businessId: string, id: string, isActive: boolean) {
    const existing = await this.repo.findById(businessId, id);
    if (!existing) throw new NotFoundError("Menu tidak ditemukan");

    return this.repo.update(businessId, id, { isActive });
  }

  getOverheadPerPortion(businessId: string): Promise<Decimal> {
    return this.costService.getOverheadPerPortion(businessId);
  }

  getDefaultTargetMargin(businessId: string): Promise<Decimal> {
    return this.costService.getDefaultTargetMargin(businessId);
  }

  previewCost(businessId: string, input: PreviewCostInput) {
    return this.costService.previewCost(businessId, input);
  }

  async saveRecipe(businessId: string, menuId: string, input: SaveRecipeInput) {
    const menu = await this.repo.findById(businessId, menuId);
    if (!menu) {
      throw new NotFoundError("Menu tidak ditemukan");
    }

    const ingredients = await this.ingredientRepo.findMany(businessId);
    const ingredientMap = new Map(ingredients.map((ing) => [ing.id, ing]));
    const itemsToSave: Array<{ ingredientId: string; qtyUsableBase: Decimal }> = [];

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i]!;
      const ing = ingredientMap.get(item.ingredientId);
      if (!ing) throw new NotFoundError(`Bahan baku pada baris ${i + 1} tidak ditemukan`);
      if (!ing.isActive) {
        throw new ValidationError(
          `Bahan "${ing.name}" berstatus nonaktif dan tidak bisa digunakan dalam resep`
        );
      }

      let qtyUsableBase = new Decimal(item.qtyUsable);
      if (item.unitName) {
        const cleanInputUnit = item.unitName.trim().toLowerCase();
        const cleanBaseUnit = ing.baseUnit.trim().toLowerCase();

        if (cleanInputUnit !== cleanBaseUnit) {
          const matchingUnit = ing.units.find(
            (u) => u.name.trim().toLowerCase() === cleanInputUnit
          );
          if (!matchingUnit) {
            throw new ValidationError(
              `Satuan "${item.unitName}" tidak terdaftar pada bahan "${ing.name}".`
            );
          }
          const toBaseFactor = new Decimal(matchingUnit.toBaseFactor.toString());
          qtyUsableBase = toBaseQuantity(item.qtyUsable, toBaseFactor);
        }
      }

      itemsToSave.push({ ingredientId: item.ingredientId, qtyUsableBase });
    }

    await this.repo.saveRecipe(businessId, menuId, itemsToSave);
    await this.alerts.reevaluateAlertsForMenu(businessId, menuId);

    return this.getMenuById(businessId, menuId);
  }

  async getMenuCost(businessId: string, menuId: string) {
    const menu = await this.repo.findById(businessId, menuId);
    if (!menu) {
      throw new NotFoundError("Menu tidak ditemukan");
    }

    return this.previewCost(businessId, {
      menuId,
      sellingPrice: menu.sellingPrice,
      targetMargin: menu.targetMargin,
      items: menu.recipeItems.map((r) => ({
        ingredientId: r.ingredientId,
        qtyUsable: r.qtyUsableBase,
        unitName: r.baseUnit,
      })),
    });
  }

  async getPosMenus(businessId: string): Promise<PosMenuItemDto[]> {
    const [menus, stockBatches] = await Promise.all([
      this.repo.findPosMenus(businessId),
      this.repo.getValidStockBatches(businessId),
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

      return {
        id: menu.id,
        name: menu.name,
        category: menu.category,
        sellingPrice: new Decimal(menu.sellingPrice.toString()).toFixed(2),
        hasRecipe: true,
        capacity: capResult.capacity,
        bottleneckIngredientName: capResult.bottleneck?.ingredientName ?? null,
      };
    });
  }
}

export const menuService = new MenuService();
