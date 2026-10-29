import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export type PaymentMethod = "CASH" | "QRIS" | "TRANSFER";

export interface SaleItemDetail {
  id: string;
  menuId: string;
  menuNameSnapshot: string;
  qty: number;
  unitPrice: string;
  ingredientCostActual?: string;
  overheadAllocated?: string;
}

export interface SaleDetail {
  id: string;
  invoiceNo: string;
  idempotencyKey: string;
  soldAt: string;
  cashierId: string;
  paymentMethod: PaymentMethod;
  totalAmount: string;
  totalIngredientCost?: string;
  totalOverhead?: string;
  status: string;
  items: SaleItemDetail[];
}

export interface CreateSaleItemPayload {
  menuId: string;
  qty: number;
}

export interface CreateSalePayload {
  paymentMethod: PaymentMethod;
  items: CreateSaleItemPayload[];
}

export interface CheckoutSaleVariables {
  payload: CreateSalePayload;
  idempotencyKey: string;
}

/**
 * Mutation hook to perform atomic POS checkout with FEFO stock deduction (POST /api/sales).
 * Invalidates sales, inventory summary, and menu queries on success.
 */
export function useCheckoutSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, idempotencyKey }: CheckoutSaleVariables) => {
      return apiClient<SaleDetail>("/sales", {
        method: "POST",
        idempotencyKey,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.all });
    },
  });
}

/**
 * Query hook to fetch detail of a specific sale transaction (GET /api/sales/:id).
 */
export function useSaleDetail(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.sales.detail(id),
    queryFn: async () => {
      return apiClient<SaleDetail>(`/sales/${id}`);
    },
    enabled: !!id && (options?.enabled ?? true),
  });
}
