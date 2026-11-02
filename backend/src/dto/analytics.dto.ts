import { Decimal } from "decimal.js";
import type { MenuCapacityResult } from "../domain/capacity.js";

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
