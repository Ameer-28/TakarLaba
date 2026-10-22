import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export type BaseUnit = "G" | "ML" | "PCS";
export type IngredientCategory = "MAIN" | "SUPPORT" | "PACKAGING";

export interface IngredientUnit {
  id: string;
  ingredientId: string;
  name: string;
  toBaseFactor: string | number;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  businessId: string;
  name: string;
  nameKey: string;
  category: IngredientCategory;
  baseUnit: BaseUnit;
  yieldPercent: string | number;
  isPerishable: boolean;
  minStockBase: string | number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  units: IngredientUnit[];
  _count?: {
    batches: number;
    recipeItems: number;
  };
}

export interface IngredientFilter {
  search?: string;
  category?: IngredientCategory;
  isActive?: boolean;
}

export interface CreateIngredientPayload {
  name: string;
  category: IngredientCategory;
  baseUnit: BaseUnit;
  yieldPercent?: number;
  isPerishable?: boolean;
  minStockBase?: number;
  purchaseUnits?: Array<{
    name: string;
    toBaseFactor: number;
  }>;
}

export interface UpdateIngredientPayload {
  name?: string;
  category?: IngredientCategory;
  baseUnit?: BaseUnit;
  yieldPercent?: number;
  isPerishable?: boolean;
  minStockBase?: number;
  isActive?: boolean;
}

export interface AddPurchaseUnitPayload {
  name: string;
  toBaseFactor: number;
}

export function useIngredients(filter?: IngredientFilter) {
  return useQuery({
    queryKey: queryKeys.ingredients.list(filter as Record<string, unknown> | undefined),
    queryFn: () =>
      apiClient<Ingredient[]>("/ingredients", {
        params: filter as Record<string, string | number | boolean | undefined>,
      }),
  });
}

export function useIngredientDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.ingredients.detail(id),
    queryFn: () => apiClient<Ingredient>(`/ingredients/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateIngredientPayload) =>
      apiClient<Ingredient>("/ingredients", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIngredientPayload }) =>
      apiClient<Ingredient>(`/ingredients/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<Ingredient>(`/ingredients/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
    },
  });
}

export function useAddPurchaseUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ingredientId, data }: { ingredientId: string; data: AddPurchaseUnitPayload }) =>
      apiClient<IngredientUnit>(`/ingredients/${ingredientId}/units`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
    },
  });
}

export function useDeletePurchaseUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ingredientId, unitId }: { ingredientId: string; unitId: string }) =>
      apiClient<{ success: boolean }>(`/ingredients/${ingredientId}/units/${unitId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
    },
  });
}
