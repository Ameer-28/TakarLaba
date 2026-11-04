import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export type MenuQuadrant = "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";

export interface MenuEngineeringRecommendation {
  action:
    "MAINTAIN_QUALITY" | "REDUCE_COST_OR_PRICE" | "PROMOTE_OR_DISCOUNT" | "EVALUATE_OR_REPLACE";
  title: string;
  description: string;
  badgeVariant: "success" | "warning" | "info" | "danger";
}

export interface ClassifiedMenuEngineeringItem {
  menuId: string;
  menuName: string;
  category: string | null;
  sellingPrice: string;
  hppPenuh: string;
  marginKontribusi: string;
  portionsSold: number;
  popularitySharePercent: string;
  quadrant: MenuQuadrant;
  recommendation: MenuEngineeringRecommendation;
}

export interface UnclassifiedMenuEngineeringItem {
  menuId: string;
  menuName: string;
  category: string | null;
  reason: "NEW_MENU" | "NO_SALES" | "NO_RECIPE" | "INCOMPLETE_COST";
  description: string;
}

export interface MenuEngineeringData {
  isDataSufficient: boolean;
  insufficientReason: string | null;
  days: number;
  totalTransactions: number;
  totalClassifiedPortions: number;
  popularityThresholdPortions: string;
  weightedMarginThreshold: string;
  classifiedMenus: ClassifiedMenuEngineeringItem[];
  unclassifiedMenus: UnclassifiedMenuEngineeringItem[];
}

export function useMenuEngineering(days = 30) {
  return useQuery({
    queryKey: queryKeys.analytics.menuEngineering(days),
    queryFn: () => apiClient<MenuEngineeringData>(`/analytics/menu-engineering?days=${days}`),
    staleTime: 60_000,
  });
}
