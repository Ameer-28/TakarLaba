import { menuRepository, MenuRepository, type MenuFilter } from "../repositories/menu.repo.js";
import { ingredientRepository, IngredientRepository } from "../repositories/ingredient.repo.js";
import { settingsRepository, SettingsRepository } from "../repositories/settings.repo.js";
import { overheadRepository, OverheadRepository } from "../repositories/overhead.repo.js";
import { normalizeNameKey, toBaseQuantity } from "../domain/units.js";
import { calculateMenuCosting, type RecipeItemCostInput } from "../domain/costing.js";
import { calculateMenuCapacity } from "../domain/capacity.js";
import { isExpired } from "../lib/date.js";
import { alertService, AlertService } from "./alert.service.js";
import { ConflictError, NotFoundError, ValidationError } from "../lib/errors.js";
import { Decimal } from "decimal.js";
import type { CreateMenuInput, UpdateMenuInput } from "../validation/menu.schema.js";
import type { PreviewCostInput, SaveRecipeInput } from "../validation/recipe.schema.js";

export class MenuService {
  constructor(
    private repo: MenuRepository = menuRepository,
    private ingredientRepo: IngredientRepository = ingredientRepository,
    private settingsRepo: SettingsRepository = settingsRepository,
    private overheadRepo: OverheadRepository = overheadRepository,
    private alerts: AlertService = alertService
  ) {}

  async listMenus(businessId: string, filter?: MenuFilter) {
    const menus = await this.repo.findMany(businessId, filter);

    // Extract all unique ingredientIds from menus that have recipe items
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

    return menus.map((m) => {
      if (!m.hasRecipe || !m.recipeItems || m.recipeItems.length === 0) {
        return {
          ...m,
          costSummary: null,
        };
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
    });
  }

  async getMenuById(businessId: string, id: string) {
    const item = await this.repo.findById(businessId, id);
    if (!item) {
      throw new NotFoundError("Menu tidak ditemukan");
    }
    return item;
  }

  async createMenu(businessId: string, input: CreateMenuInput) {
    const nameKey = normalizeNameKey(input.name);

    // Enforce unique nameKey per business
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

    // Check if selling price changed
    let priceHistory:
      | {
          oldPrice: string;
          newPrice: string;
          reason: "MANUAL";
          changedById: string;
        }
      | undefined;

    if (input.sellingPrice !== undefined) {
      const oldPriceDec = new Decimal(existing.sellingPrice);
      const newPriceDec = new Decimal(input.sellingPrice);
      if (!oldPriceDec.equals(newPriceDec)) {
        priceHistory = {
          oldPrice: existing.sellingPrice,
          newPrice: newPriceDec.toFixed(2),
          reason: "MANUAL",
          changedById: userId,
        };
      }
    }

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
    if (!existing) {
      throw new NotFoundError("Menu tidak ditemukan");
    }

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
    if (!existing) {
      throw new NotFoundError("Menu tidak ditemukan");
    }

    return this.repo.update(businessId, id, { isActive });
  }

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
   * Helper to retrieve default business target margin.
   */
  async getDefaultTargetMargin(businessId: string): Promise<Decimal> {
    const business = await this.settingsRepo.findById(businessId);
    return business ? new Decimal(business.targetMarginDefault.toString()) : new Decimal(50);
  }

  /**
   * Preview costing for a draft recipe (POST /api/menus/preview-cost).
   * Does not persist any changes to the database.
   */
  async previewCost(businessId: string, input: PreviewCostInput) {
    let sellingPrice = input.sellingPrice !== undefined ? new Decimal(input.sellingPrice) : null;
    let targetMargin =
      input.targetMargin !== undefined && input.targetMargin !== null
        ? new Decimal(input.targetMargin)
        : null;

    if (input.menuId) {
      const menu = await this.repo.findById(businessId, input.menuId);
      if (menu) {
        if (sellingPrice === null) sellingPrice = new Decimal(menu.sellingPrice);
        if (targetMargin === null && menu.targetMargin) {
          targetMargin = new Decimal(menu.targetMargin);
        }
      }
    }

    if (targetMargin === null) {
      targetMargin = await this.getDefaultTargetMargin(businessId);
    }

    if (sellingPrice === null) {
      sellingPrice = new Decimal(0);
    }

    const overheadPerPortion = await this.getOverheadPerPortion(businessId);

    if (input.items.length === 0) {
      return {
        hppBahan: null,
        overheadPerPortion: overheadPerPortion.toFixed(2),
        hppPenuh: null,
        sellingPrice: sellingPrice.toFixed(2),
        marginKontribusi: null,
        marginPercent: null,
        marginBahanPercent: null,
        marginStatus: "INCOMPLETE",
        isCostComplete: false,
        items: [],
      };
    }

    // Load ingredients and conversion units
    const ingredientIds = input.items.map((i) => i.ingredientId);
    const ingredients = await this.ingredientRepo.findMany(businessId);
    const ingredientMap = new Map(ingredients.map((ing) => [ing.id, ing]));

    // Validate ingredients and convert units
    const recipeCostInputs: RecipeItemCostInput[] = [];
    const itemMetadataList: Array<{
      ingredientName: string;
      baseUnit: string;
      inputUnit: string;
      toBaseFactor: string;
    }> = [];

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i]!;
      const ing = ingredientMap.get(item.ingredientId);
      if (!ing) {
        throw new NotFoundError(`Bahan baku pada baris ${i + 1} tidak ditemukan`);
      }
      if (!ing.isActive) {
        throw new ValidationError(
          `Bahan "${ing.name}" berstatus nonaktif dan tidak bisa digunakan dalam resep`
        );
      }

      // Convert unit if custom unitName provided
      let qtyUsableBase = new Decimal(item.qtyUsable);
      let toBaseFactor = new Decimal(1);
      const inputUnit = item.unitName ? item.unitName.trim() : ing.baseUnit;

      if (item.unitName) {
        const cleanInputUnit = item.unitName.trim().toLowerCase();
        const cleanBaseUnit = ing.baseUnit.trim().toLowerCase();

        if (cleanInputUnit !== cleanBaseUnit) {
          const matchingUnit = ing.units.find(
            (u) => u.name.trim().toLowerCase() === cleanInputUnit
          );
          if (!matchingUnit) {
            throw new ValidationError(
              `Satuan "${item.unitName}" tidak terdaftar pada bahan "${ing.name}". Gunakan satuan dasar (${ing.baseUnit.toLowerCase()}) atau tambahkan konversi satuan pada master bahan.`
            );
          }
          toBaseFactor = new Decimal(matchingUnit.toBaseFactor.toString());
          qtyUsableBase = toBaseQuantity(item.qtyUsable, toBaseFactor);
        }
      }

      recipeCostInputs.push({
        ingredientId: item.ingredientId,
        qtyUsable: qtyUsableBase,
        costPerBase: null, // to be populated from costMap
        yieldPercent: ing.yieldPercent,
      });

      itemMetadataList.push({
        ingredientName: ing.name,
        baseUnit: ing.baseUnit,
        inputUnit,
        toBaseFactor: toBaseFactor.toFixed(4),
      });
    }

    // Load latest replacement costs (BR-03)
    const costMap = await this.repo.getLatestCostPerBaseMap(businessId, ingredientIds);

    for (const costInput of recipeCostInputs) {
      const latestCost = costMap.get(costInput.ingredientId);
      costInput.costPerBase = latestCost ?? null;
    }

    // Calculate domain costing
    const result = calculateMenuCosting({
      recipeItems: recipeCostInputs,
      overheadPerPortion,
      sellingPrice,
      targetMarginPercent: targetMargin,
    });

    return {
      hppBahan: result.hppBahan ? result.hppBahan.toFixed(2) : null,
      overheadPerPortion: result.overheadPerPortion.toFixed(2),
      hppPenuh: result.hppPenuh ? result.hppPenuh.toFixed(2) : null,
      sellingPrice: result.sellingPrice.toFixed(2),
      marginKontribusi: result.marginKontribusi ? result.marginKontribusi.toFixed(2) : null,
      marginPercent: result.marginPercent ? result.marginPercent.toFixed(2) : null,
      marginBahanPercent: result.marginBahanPercent ? result.marginBahanPercent.toFixed(2) : null,
      marginStatus: result.marginStatus,
      isCostComplete: result.isCostComplete,
      items: result.items.map((item, idx) => {
        const meta = itemMetadataList[idx]!;
        return {
          ingredientId: item.ingredientId,
          ingredientName: meta.ingredientName,
          baseUnit: meta.baseUnit,
          inputUnit: meta.inputUnit,
          toBaseFactor: meta.toBaseFactor,
          qtyUsable: item.qtyUsable.toFixed(3),
          yieldPercent: item.yieldPercent.toFixed(2),
          costPerBase: item.costPerBase ? item.costPerBase.toFixed(6) : null,
          costPerUsable: item.costPerUsable ? item.costPerUsable.toFixed(6) : null,
          subtotal: item.subtotal ? item.subtotal.toFixed(2) : null,
          hasCost: item.hasCost,
        };
      }),
    };
  }

  /**
   * Save / overwrite menu recipe (PUT /api/menus/:id/recipe).
   */
  async saveRecipe(businessId: string, menuId: string, input: SaveRecipeInput) {
    const menu = await this.repo.findById(businessId, menuId);
    if (!menu) {
      throw new NotFoundError("Menu tidak ditemukan");
    }

    // Load ingredients
    const ingredients = await this.ingredientRepo.findMany(businessId);
    const ingredientMap = new Map(ingredients.map((ing) => [ing.id, ing]));

    const itemsToSave: Array<{
      ingredientId: string;
      qtyUsableBase: Decimal;
    }> = [];

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i]!;
      const ing = ingredientMap.get(item.ingredientId);
      if (!ing) {
        throw new NotFoundError(`Bahan baku pada baris ${i + 1} tidak ditemukan`);
      }
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

      itemsToSave.push({
        ingredientId: item.ingredientId,
        qtyUsableBase,
      });
    }

    await this.repo.saveRecipe(businessId, menuId, itemsToSave);
    await this.alerts.reevaluateAlertsForMenu(businessId, menuId);

    // Return updated menu detail
    return this.getMenuById(businessId, menuId);
  }

  /**
   * Get detailed costing for an existing menu based on its saved recipe (GET /api/menus/:id/cost).
   */
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

  /**
   * Retrieves sellable active menus with portion capacity for POS screen (BR-08, FR-CAP-01).
   * Enforces DTO allowlist: id, name, category, sellingPrice, hasRecipe, capacity, bottleneckIngredientName.
   * Strips all cost/HPP/margin fields (Cashier Confidentiality Rule 7).
   * Computes capacity via single aggregated query (no N+1).
   */
  async getPosMenus(businessId: string): Promise<PosMenuItemDto[]> {
    const [menus, stockBatches] = await Promise.all([
      this.repo.findPosMenus(businessId),
      this.repo.getValidStockBatches(businessId),
    ]);

    // Aggregate valid non-expired stock per ingredient
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

export interface PosMenuItemDto {
  id: string;
  name: string;
  category: string | null;
  sellingPrice: string;
  hasRecipe: boolean;
  capacity: number;
  bottleneckIngredientName: string | null;
}

export const menuService = new MenuService();
