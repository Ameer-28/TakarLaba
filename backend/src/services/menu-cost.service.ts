import { Decimal } from "decimal.js";
import { toBaseQuantity } from "../domain/units.js";
import { calculateMenuCosting, type RecipeItemCostInput } from "../domain/costing.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import type { MenuRepository } from "../repositories/menu.repo.js";
import type { IngredientRepository } from "../repositories/ingredient.repo.js";
import type { SettingsRepository } from "../repositories/settings.repo.js";
import type { OverheadRepository } from "../repositories/overhead.repo.js";
import type { PreviewCostInput } from "../validation/recipe.schema.js";

export interface CostPreviewMetaItem {
  ingredientName: string;
  baseUnit: string;
  inputUnit: string;
  toBaseFactor: string;
}

export class MenuCostService {
  constructor(
    private repo: MenuRepository,
    private ingredientRepo: IngredientRepository,
    private settingsRepo: SettingsRepository,
    private overheadRepo: OverheadRepository
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

  async getDefaultTargetMargin(businessId: string): Promise<Decimal> {
    const business = await this.settingsRepo.findById(businessId);
    return business ? new Decimal(business.targetMarginDefault.toString()) : new Decimal(50);
  }

  async previewCost(businessId: string, input: PreviewCostInput) {
    const { sellingPrice, targetMargin, overheadPerPortion } =
      await this.resolvePreviewPriceAndMargin(businessId, input);

    if (input.items.length === 0) {
      return this.emptyPreviewResponse(sellingPrice, overheadPerPortion);
    }

    const ingredients = await this.ingredientRepo.findMany(businessId);
    const { recipeCostInputs, itemMetadataList } = this.prepareRecipeCostInputs(
      input.items,
      ingredients
    );

    const ingredientIds = input.items.map((i) => i.ingredientId);
    const costMap = await this.repo.getLatestCostPerBaseMap(businessId, ingredientIds);
    for (const costInput of recipeCostInputs) {
      costInput.costPerBase = costMap.get(costInput.ingredientId) ?? null;
    }

    const result = calculateMenuCosting({
      recipeItems: recipeCostInputs,
      overheadPerPortion,
      sellingPrice,
      targetMarginPercent: targetMargin,
    });

    return this.formatCostPreviewResponse(result, itemMetadataList);
  }

  private async resolvePreviewPriceAndMargin(businessId: string, input: PreviewCostInput) {
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
    return { sellingPrice, targetMargin, overheadPerPortion };
  }

  private emptyPreviewResponse(sellingPrice: Decimal, overheadPerPortion: Decimal) {
    return {
      hppBahan: null,
      overheadPerPortion: overheadPerPortion.toFixed(2),
      hppPenuh: null,
      sellingPrice: sellingPrice.toFixed(2),
      marginKontribusi: null,
      marginPercent: null,
      marginBahanPercent: null,
      marginStatus: "INCOMPLETE" as const,
      isCostComplete: false,
      items: [],
    };
  }

  private prepareRecipeCostInputs(
    items: PreviewCostInput["items"],
    ingredients: Awaited<ReturnType<IngredientRepository["findMany"]>>
  ) {
    const ingredientMap = new Map(ingredients.map((ing) => [ing.id, ing]));
    const recipeCostInputs: RecipeItemCostInput[] = [];
    const itemMetadataList: CostPreviewMetaItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const ing = ingredientMap.get(item.ingredientId);
      if (!ing) throw new NotFoundError(`Bahan baku pada baris ${i + 1} tidak ditemukan`);
      if (!ing.isActive) {
        throw new ValidationError(
          `Bahan "${ing.name}" berstatus nonaktif dan tidak bisa digunakan dalam resep`
        );
      }

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
        costPerBase: null,
        yieldPercent: ing.yieldPercent,
      });

      itemMetadataList.push({
        ingredientName: ing.name,
        baseUnit: ing.baseUnit,
        inputUnit,
        toBaseFactor: toBaseFactor.toFixed(4),
      });
    }

    return { recipeCostInputs, itemMetadataList };
  }

  private formatCostPreviewResponse(
    result: ReturnType<typeof calculateMenuCosting>,
    itemMetadataList: CostPreviewMetaItem[]
  ) {
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
}
