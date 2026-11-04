import { Decimal } from "decimal.js";
import type { MenuCapacityResult } from "../domain/capacity.js";
import type {
  MenuEngineeringResult,
  MenuQuadrant,
  MenuEngineeringRecommendation,
} from "../domain/menu-engineering.js";

export interface CashierCapacityMenuDto {
  id: string;
  name: string;
  category: string | null;
  sellingPrice: string;
  hasRecipe: boolean;
  capacity: number;
  bottleneckIngredientName: string | null;
}

export interface OwnerCapacityItemDetailDto {
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  validStockBase: string;
  rawPerPortion: string;
  maxPortions: number;
}

export interface OwnerCapacityMenuDto extends CashierCapacityMenuDto {
  bottleneck: OwnerCapacityItemDetailDto | null;
  items: OwnerCapacityItemDetailDto[];
}

export interface MenuEngineeringClassifiedItemDto {
  menuId: string;
  menuName: string;
  category: string | null;
  sellingPrice: string;
  hppPenuh: string;
  marginKontribusi: string;
  portionsSold: number;
  popularitySharePercent: string;
  quadrant: MenuQuadrant;
  recommendation: MenuEngineeringRecommendation;
}

export interface MenuEngineeringUnclassifiedItemDto {
  menuId: string;
  menuName: string;
  category: string | null;
  reason: "NEW_MENU" | "NO_SALES" | "NO_RECIPE" | "INCOMPLETE_COST";
  description: string;
}

export interface MenuEngineeringResponseDto {
  isDataSufficient: boolean;
  insufficientReason: string | null;
  days: number;
  totalTransactions: number;
  totalClassifiedPortions: number;
  popularityThresholdPortions: string;
  weightedMarginThreshold: string;
  classifiedMenus: MenuEngineeringClassifiedItemDto[];
  unclassifiedMenus: MenuEngineeringUnclassifiedItemDto[];
}

export function toMenuEngineeringDto(result: MenuEngineeringResult): MenuEngineeringResponseDto {
  return {
    isDataSufficient: result.isDataSufficient,
    insufficientReason: result.insufficientReason ?? null,
    days: result.days,
    totalTransactions: result.totalTransactions,
    totalClassifiedPortions: result.totalClassifiedPortions,
    popularityThresholdPortions: result.popularityThresholdPortions.toFixed(2),
    weightedMarginThreshold: result.weightedMarginThreshold.toFixed(2),
    classifiedMenus: result.classifiedMenus.map((item) => ({
      menuId: item.menuId,
      menuName: item.menuName,
      category: item.category,
      sellingPrice: item.sellingPrice.toFixed(2),
      hppPenuh: item.hppPenuh.toFixed(2),
      marginKontribusi: item.marginKontribusi.toFixed(2),
      portionsSold: item.portionsSold,
      popularitySharePercent: item.popularitySharePercent.toFixed(1),
      quadrant: item.quadrant,
      recommendation: item.recommendation,
    })),
    unclassifiedMenus: result.unclassifiedMenus.map((item) => ({
      menuId: item.menuId,
      menuName: item.menuName,
      category: item.category,
      reason: item.reason,
      description: item.description,
    })),
  };
}

export function toCashierCapacityDto(
  menu: { id: string; name: string; category: string | null; sellingPrice: string | Decimal },
  result: MenuCapacityResult
): CashierCapacityMenuDto {
  return {
    id: menu.id,
    name: menu.name,
    category: menu.category,
    sellingPrice: new Decimal(menu.sellingPrice.toString()).toFixed(2),
    hasRecipe: result.hasRecipe,
    capacity: result.capacity,
    bottleneckIngredientName: result.bottleneck?.ingredientName ?? null,
  };
}

export function toOwnerCapacityDto(
  menu: { id: string; name: string; category: string | null; sellingPrice: string | Decimal },
  result: MenuCapacityResult
): OwnerCapacityMenuDto {
  return {
    id: menu.id,
    name: menu.name,
    category: menu.category,
    sellingPrice: new Decimal(menu.sellingPrice.toString()).toFixed(2),
    hasRecipe: result.hasRecipe,
    capacity: result.capacity,
    bottleneckIngredientName: result.bottleneck?.ingredientName ?? null,
    bottleneck: result.bottleneck
      ? {
          ingredientId: result.bottleneck.ingredientId,
          ingredientName: result.bottleneck.ingredientName,
          baseUnit: result.bottleneck.baseUnit,
          validStockBase: result.bottleneck.validStockBase.toFixed(3),
          rawPerPortion: result.bottleneck.rawPerPortion.toFixed(3),
          maxPortions: result.bottleneck.maxPortions,
        }
      : null,
    items: result.items.map((item) => ({
      ingredientId: item.ingredientId,
      ingredientName: item.ingredientName,
      baseUnit: item.baseUnit,
      validStockBase: item.validStockBase.toFixed(3),
      rawPerPortion: item.rawPerPortion.toFixed(3),
      maxPortions: item.maxPortions,
    })),
  };
}
