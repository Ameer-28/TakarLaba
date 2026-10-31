import { Decimal } from "decimal.js";
import type { OptionASnapshot, OptionBSnapshot } from "../domain/alert-snapshot.js";

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

type PrismaAlertWithRelations = {
  id: string;
  businessId: string;
  menuId: string;
  status: string;
  resolution: string | null;
  note: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  ingredientCostBefore: Decimal | string | number;
  ingredientCostAfter: Decimal | string | number;
  fullCostBefore: Decimal | string | number;
  fullCostAfter: Decimal | string | number;
  marginBeforePct: Decimal | string | number;
  marginAfterPct: Decimal | string | number;
  targetPct: Decimal | string | number;
  sellingPriceAtTrigger: Decimal | string | number;
  recommendedPrice: Decimal | string | number;
  menu: {
    id: string;
    name: string;
    sellingPrice: Decimal | string | number;
    targetMargin: Decimal | string | number | null;
  };
  resolvedBy?: { id: string; name: string } | null;
  triggerIngredient?: { id: string; name: string; baseUnit: string } | null;
  triggerPurchase?: { id: string; supplierName: string | null; purchasedAt: Date } | null;
};

export function buildAlertPayload(params: {
  triggerPurchaseId?: string;
  triggerIngredientId: string;
  hppBahanBefore: Decimal;
  hppBahanAfter: Decimal;
  hppPenuhBefore: Decimal;
  hppPenuhAfter: Decimal;
  marginBeforePct: Decimal;
  marginAfterPct: Decimal;
  targetMargin: Decimal;
  currentPrice: Decimal;
  recommendedPrice: Decimal;
  note?: string;
}) {
  return {
    triggerPurchaseId: params.triggerPurchaseId,
    triggerIngredientId: params.triggerIngredientId,
    ingredientCostBefore: params.hppBahanBefore,
    ingredientCostAfter: params.hppBahanAfter,
    fullCostBefore: params.hppPenuhBefore,
    fullCostAfter: params.hppPenuhAfter,
    marginBeforePct: params.marginBeforePct,
    marginAfterPct: params.marginAfterPct,
    targetPct: params.targetMargin,
    sellingPriceAtTrigger: params.currentPrice,
    recommendedPrice: params.recommendedPrice,
    ...(params.note ? { note: params.note } : {}),
  };
}

export function buildImpactedMenuAlertDto(params: {
  alertId: string;
  menuId: string;
  menuName: string;
  triggerIngredientId: string;
  triggerIngredientName: string;
  hppBahanBefore: Decimal;
  hppBahanAfter: Decimal;
  hppPenuhBefore: Decimal;
  hppPenuhAfter: Decimal;
  marginBeforePct: Decimal;
  marginAfterPct: Decimal;
  targetMargin: Decimal;
  currentPrice: Decimal;
  optionA: OptionASnapshot;
  optionB: OptionBSnapshot;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
}): ImpactedMenuAlert {
  return {
    alertId: params.alertId,
    menuId: params.menuId,
    menuName: params.menuName,
    triggerIngredientId: params.triggerIngredientId,
    triggerIngredientName: params.triggerIngredientName,
    costBefore: {
      hppBahan: params.hppBahanBefore.toFixed(2),
      hppPenuh: params.hppPenuhBefore.toFixed(2),
      marginPercent: params.marginBeforePct.toFixed(2),
    },
    costAfter: {
      hppBahan: params.hppBahanAfter.toFixed(2),
      hppPenuh: params.hppPenuhAfter.toFixed(2),
      marginPercent: params.marginAfterPct.toFixed(2),
    },
    targetMarginPercent: params.targetMargin.toFixed(2),
    sellingPrice: params.currentPrice.toFixed(2),
    optionA: params.optionA,
    optionB: params.optionB,
    status: params.status,
  };
}

export function mapAlertListItem(alert: PrismaAlertWithRelations) {
  return {
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
    resolvedBy: alert.resolvedBy ? { id: alert.resolvedBy.id, name: alert.resolvedBy.name } : null,
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
    ingredientCostBefore: new Decimal(alert.ingredientCostBefore.toString()).toFixed(2),
    ingredientCostAfter: new Decimal(alert.ingredientCostAfter.toString()).toFixed(2),
    fullCostBefore: new Decimal(alert.fullCostBefore.toString()).toFixed(2),
    fullCostAfter: new Decimal(alert.fullCostAfter.toString()).toFixed(2),
    marginBeforePct: new Decimal(alert.marginBeforePct.toString()).toFixed(2),
    marginAfterPct: new Decimal(alert.marginAfterPct.toString()).toFixed(2),
    targetPct: new Decimal(alert.targetPct.toString()).toFixed(2),
    sellingPriceAtTrigger: new Decimal(alert.sellingPriceAtTrigger.toString()).toFixed(2),
    recommendedPrice: new Decimal(alert.recommendedPrice.toString()).toFixed(2),
  };
}

export function mapAlertDetail(
  alert: PrismaAlertWithRelations & {
    menu: PrismaAlertWithRelations["menu"] & {
      recipeItems: Array<{
        id: string;
        ingredientId: string;
        qtyUsableBase: Decimal | string | number;
        ingredient: { name: string; baseUnit: string };
      }>;
    };
  },
  optionA: OptionASnapshot,
  optionB: OptionBSnapshot | null
) {
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
    resolvedBy: alert.resolvedBy ? { id: alert.resolvedBy.id, name: alert.resolvedBy.name } : null,
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
      ingredientCostBefore: new Decimal(alert.ingredientCostBefore.toString()).toFixed(2),
      ingredientCostAfter: new Decimal(alert.ingredientCostAfter.toString()).toFixed(2),
      fullCostBefore: new Decimal(alert.fullCostBefore.toString()).toFixed(2),
      fullCostAfter: new Decimal(alert.fullCostAfter.toString()).toFixed(2),
      marginBeforePct: new Decimal(alert.marginBeforePct.toString()).toFixed(2),
      marginAfterPct: new Decimal(alert.marginAfterPct.toString()).toFixed(2),
      targetPct: new Decimal(alert.targetPct.toString()).toFixed(2),
      sellingPriceAtTrigger: new Decimal(alert.sellingPriceAtTrigger.toString()).toFixed(2),
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
