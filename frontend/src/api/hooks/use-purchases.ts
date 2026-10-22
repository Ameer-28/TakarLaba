import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export interface PurchaseStockBatch {
  id: string;
  ingredientId: string;
  purchaseId: string | null;
  receivedAt: string;
  expiryDate: string | null;
  purchaseQty: string | number;
  purchaseUnit: string;
  purchaseUnitPrice: string | number;
  initialQtyBase: string | number;
  remainingQtyBase: string | number;
  costPerBase: string | number;
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
  totalAmount: string | number;
  createdById: string;
  createdAt: string;
  batches: PurchaseStockBatch[];
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
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
  purchaseQty: number;
  purchaseUnit: string;
  purchaseUnitPrice: number;
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
    },
  });
}
