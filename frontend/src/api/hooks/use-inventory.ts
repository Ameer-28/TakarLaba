import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export type StockStatus = "AMAN" | "SEGERA" | "KEDALUWARSA" | "HABIS";

export interface IngredientStockSummary {
  id: string;
  name: string;
  category: string;
  baseUnit: string;
  minStockBase: string;
  validStockBase: string;
  expiredStockBase: string;
  nearestExpiryDate: string | null;
  status: StockStatus;
  isLowStock: boolean;
  activeBatchCount: number;
  averageCostPerBase?: string | null;
  latestCostPerBase?: string | null;
}

export interface StockBatchItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  category: string;
  receivedAt: string;
  expiryDate: string | null;
  purchaseQty: string;
  purchaseUnit: string;
  purchaseUnitPrice?: string;
  initialQtyBase: string;
  remainingQtyBase: string;
  costPerBase?: string;
  status: StockStatus;
  supplierName?: string | null;
  purchaseId?: string | null;
}

export function useInventorySummary(warnDays = 3) {
  return useQuery({
    queryKey: queryKeys.inventory.summary(warnDays),
    queryFn: () =>
      apiClient<IngredientStockSummary[]>("/inventory/summary", {
        params: { warnDays },
      }),
  });
}

export function useInventoryBatches(filter?: {
  ingredientId?: string;
  hasRemainingOnly?: boolean;
  warnDays?: number;
}) {
  return useQuery({
    queryKey: queryKeys.inventory.batches(filter as Record<string, unknown> | undefined),
    queryFn: () =>
      apiClient<StockBatchItem[]>("/inventory/batches", {
        params: filter as Record<string, string | number | boolean | undefined>,
      }),
  });
}
