import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export type PaymentMethod = "CASH" | "QRIS" | "TRANSFER";
export type SaleStatus = "COMPLETED" | "VOIDED";

export interface BatchAllocationDetail {
  movementId: string;
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  batchId: string | null;
  batchExpiryDate: string | null;
  qtyDeducted: string;
  costPerBase?: string;
  subtotalCost?: string;
}

export interface SaleItemDetail {
  id: string;
  menuId: string;
  menuNameSnapshot: string;
  qty: number;
  unitPrice: string;
  subtotalPrice?: string;
  ingredientCostActual?: string;
  overheadAllocated?: string;
  grossMargin?: string;
  marginPercentage?: string;
  batchAllocations?: BatchAllocationDetail[];
}

export interface SaleCashierInfo {
  id: string;
  name: string;
  role: string;
}

export interface SaleDetail {
  id: string;
  invoiceNo: string;
  idempotencyKey: string;
  soldAt: string;
  cashierId: string;
  cashier?: SaleCashierInfo;
  paymentMethod: PaymentMethod;
  totalAmount: string;
  totalIngredientCost?: string;
  totalOverhead?: string;
  grossMargin?: string;
  marginPercentage?: string;
  status: SaleStatus;
  items: SaleItemDetail[];
}

export interface SalesQueryFilters {
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  status?: SaleStatus;
  cashierId?: string;
  page?: number;
  limit?: number;
}

export interface SalesListResponse {
  items: SaleDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
 * Query hook to fetch paginated list of sales with optional filters (GET /api/sales).
 */
export function useSalesList(filters?: SalesQueryFilters) {
  const filterRecord = filters as Record<string, unknown> | undefined;

  return useQuery({
    queryKey: queryKeys.sales.list(filterRecord),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filters?.startDate) searchParams.set("startDate", filters.startDate);
      if (filters?.endDate) searchParams.set("endDate", filters.endDate);
      if (filters?.paymentMethod) searchParams.set("paymentMethod", filters.paymentMethod);
      if (filters?.status) searchParams.set("status", filters.status);
      if (filters?.cashierId) searchParams.set("cashierId", filters.cashierId);
      if (filters?.page) searchParams.set("page", filters.page.toString());
      if (filters?.limit) searchParams.set("limit", filters.limit.toString());

      const qs = searchParams.toString();
      const endpoint = qs ? `/sales?${qs}` : "/sales";
      return apiClient<SalesListResponse>(endpoint);
    },
  });
}

/**
 * Query hook to fetch detail of a specific sale transaction with batch allocations (GET /api/sales/:id).
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
