import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export interface CapacityBottleneckDetail {
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  validStockBase: string;
  rawPerPortion: string;
  maxPortions: number;
}

export interface CapacityMenuItem {
  id: string;
  name: string;
  category: string | null;
  sellingPrice: string;
  hasRecipe: boolean;
  capacity: number;
  bottleneckIngredientName: string | null;
  bottleneck?: CapacityBottleneckDetail | null;
  items?: CapacityBottleneckDetail[];
}

export function useCapacity() {
  return useQuery({
    queryKey: queryKeys.analytics.capacity(),
    queryFn: () => apiClient<CapacityMenuItem[]>("/analytics/capacity"),
    staleTime: 30_000,
  });
}
