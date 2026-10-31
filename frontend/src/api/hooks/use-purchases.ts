import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";
import type { ImpactedMenuAlert } from "./use-alerts.js";

export interface PurchaseStockBatch {
  id: string;
  ingredientId: string;
  purchaseId: string | null;
  receivedAt: string;
  expiryDate: string | null;
  purchaseQty: string;
  purchaseUnit: string;
  purchaseUnitPrice: string;
  initialQtyBase: string;
  remainingQtyBase: string;
  costPerBase: string;
  ingredient: {
    id: string;
    name: string;
    baseUnit: string;
    category: string;
  };
}

export interface PurchaseRecord {
  id: string;
  businessId: string;
  supplierName: string | null;
  purchasedAt: string;
  note: string | null;
  totalAmount: string;
  createdById: string;
  createdAt: string;
  batches: PurchaseStockBatch[];
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  priceShockAlerts?: ImpactedMenuAlert[];
}

export interface PurchaseFilter {
  startDate?: string;
  endDate?: string;
  supplier?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseItemPayload {
  ingredientId: string;
  purchaseQty: string | number;
  purchaseUnit: string;
  purchaseUnitPrice: string | number;
  expiryDate?: string | null;
}

export interface CreatePurchasePayload {
  purchasedAt?: string;
  supplierName?: string | null;
  note?: string | null;
  items: PurchaseItemPayload[];
}

export function usePurchases(filter?: PurchaseFilter) {
  return useQuery({
    queryKey: queryKeys.purchases.list(filter as Record<string, unknown> | undefined),
    queryFn: () =>
      apiClient<PurchaseRecord[]>("/purchases", {
        params: filter as Record<string, string | number | boolean | undefined>,
      }),
  });
}

export function usePurchaseDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.purchases.detail(id),
    queryFn: () => apiClient<PurchaseRecord>(`/purchases/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchasePayload) =>
      apiClient<PurchaseRecord>("/purchases", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}
