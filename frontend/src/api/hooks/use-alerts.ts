import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export type AlertResolution = "PRICE_RAISED" | "RECIPE_ADJUSTED" | "DISMISSED" | "AUTO_RESOLVED";

export interface AlertListItem {
  id: string;
  businessId: string;
  menuId: string;
  menu: {
    id: string;
    name: string;
    sellingPrice: string;
    targetMargin: string | null;
  };
  status: AlertStatus;
  resolution: AlertResolution | null;
  note: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: { id: string; name: string } | null;
  triggerIngredient: {
    id: string;
    name: string;
    baseUnit: string;
  } | null;
  triggerPurchase: {
    id: string;
    supplierName: string | null;
    purchasedAt: string;
  } | null;
  ingredientCostBefore: string;
  ingredientCostAfter: string;
  fullCostBefore: string;
  fullCostAfter: string;
  marginBeforePct: string;
  marginAfterPct: string;
  targetPct: string;
  sellingPriceAtTrigger: string;
  recommendedPrice: string;
}

export interface AlertDetailOptionA {
  recommendedPrice: string;
  projectedMarginPercent: string;
  projectedMarginKontribusi: string;
  priceIncrease: string;
}

export interface AlertDetailOptionB {
  maxAllowableCost: string;
  costSavingNeeded: string;
  currentTakaran: string;
  reducedAmount: string;
  newTakaran: string;
  unit: string;
  reductionPercent: string;
  isFeasible: boolean;
  infeasibleReason?: string;
  projectedHppPenuh?: string;
  projectedMarginPercent?: string;
}

export interface AlertDetail {
  id: string;
  businessId: string;
  menuId: string;
  menuName: string;
  menuSellingPrice: string;
  status: AlertStatus;
  resolution: AlertResolution | null;
  note: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: { id: string; name: string } | null;
  triggerPurchase: {
    id: string;
    supplierName: string | null;
    purchasedAt: string;
  } | null;
  triggerIngredient: {
    id: string;
    name: string;
    baseUnit: string;
  } | null;
  costs: {
    ingredientCostBefore: string;
    ingredientCostAfter: string;
    fullCostBefore: string;
    fullCostAfter: string;
    marginBeforePct: string;
    marginAfterPct: string;
    targetPct: string;
    sellingPriceAtTrigger: string;
  };
  optionA: AlertDetailOptionA;
  optionB: AlertDetailOptionB | null;
  recipe: Array<{
    id: string;
    ingredientId: string;
    ingredientName: string;
    amount: string;
    unit: string;
  }>;
}

export interface ImpactedMenuAlert {
  alertId: string;
  menuId: string;
  menuName: string;
  triggerIngredientId: string;
  triggerIngredientName: string;
  costBefore: {
    hppBahan: string;
    hppPenuh: string;
    marginPercent: string;
  };
  costAfter: {
    hppBahan: string;
    hppPenuh: string;
    marginPercent: string;
  };
  targetMarginPercent: string;
  sellingPrice: string;
  optionA: AlertDetailOptionA;
  optionB: AlertDetailOptionB;
  status: AlertStatus;
}

export interface AlertFilter {
  status?: AlertStatus;
  menuId?: string;
  page?: number;
  limit?: number;
}

export function useAlerts(filter?: AlertFilter) {
  return useQuery({
    queryKey: queryKeys.alerts.list(filter as Record<string, unknown> | undefined),
    queryFn: () =>
      apiClient<AlertListItem[]>("/alerts", {
        params: filter as Record<string, string | number | boolean | undefined>,
      }),
  });
}

export function useAlertDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.alerts.detail(id),
    queryFn: () => apiClient<AlertDetail>(`/alerts/${id}`),
    enabled: Boolean(id),
  });
}

export function useApplyAlertPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) =>
      apiClient<AlertListItem>(`/alerts/${alertId}/apply-price`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.all });
    },
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, note }: { alertId: string; note?: string }) =>
      apiClient<AlertListItem>(`/alerts/${alertId}/dismiss`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) =>
      apiClient<AlertListItem>(`/alerts/${alertId}/acknowledge`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });
}
