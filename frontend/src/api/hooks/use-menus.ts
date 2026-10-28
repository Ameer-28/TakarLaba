import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export interface RecipeItemDetail {
  id: string;
  menuId: string;
  ingredientId: string;
  ingredientName: string;
  baseUnit: "G" | "ML" | "PCS";
  category: "MAIN" | "SUPPORT" | "PACKAGING";
  yieldPercent: string;
  isIngredientActive: boolean;
  qtyUsableBase: string;
  createdAt: string;
}

export interface PriceHistoryDetail {
  id: string;
  oldPrice: string;
  newPrice: string;
  reason: "MANUAL" | "PRICE_SHOCK_ALERT";
  alertId: string | null;
  changedById: string;
  changedByName: string;
  changedAt: string;
}

export interface MenuItem {
  id: string;
  businessId: string;
  name: string;
  nameKey: string;
  category: string | null;
  sellingPrice: string;
  targetMargin: string | null;
  isActive: boolean;
  hasRecipe: boolean;
  recipeItemsCount: number;
  saleItemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuDetail extends MenuItem {
  recipeItems: RecipeItemDetail[];
  priceHistories: PriceHistoryDetail[];
}

export interface MenuFilter {
  search?: string;
  category?: string;
  isActive?: boolean;
}

export interface CreateMenuPayload {
  name: string;
  category?: string | null;
  sellingPrice: number | string;
  targetMargin?: number | string | null;
  isActive?: boolean;
}

export interface UpdateMenuPayload {
  name?: string;
  category?: string | null;
  sellingPrice?: number | string;
  targetMargin?: number | string | null;
  isActive?: boolean;
}

export function useMenus(filter?: MenuFilter) {
  return useQuery({
    queryKey: queryKeys.menus.list(filter as Record<string, unknown> | undefined),
    queryFn: () => {
      const params: Record<string, string | boolean | undefined> = {};
      if (filter?.search) params.search = filter.search;
      if (filter?.category) params.category = filter.category;
      if (filter?.isActive !== undefined) params.isActive = filter.isActive;

      return apiClient<MenuItem[]>("/menus", { params });
    },
  });
}

export function useMenuDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.menus.detail(id),
    queryFn: () => apiClient<MenuDetail>(`/menus/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMenuPayload) =>
      apiClient<MenuItem>("/menus", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.all });
    },
  });
}

export function useUpdateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMenuPayload }) =>
      apiClient<MenuItem>(`/menus/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.detail(variables.id) });
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ id: string }>(`/menus/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.all });
    },
  });
}
