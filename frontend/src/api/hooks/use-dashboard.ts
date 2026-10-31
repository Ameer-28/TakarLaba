import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export interface DashboardSummaryData {
  summary: {
    omzet: string;
    transactionCount: number;
    estimatedProfit: string;
    averageMarginPercent: string;
    openAlertCount: number;
    expiringStockValue: string;
    lowStockCount: number;
    targetMargin: string;
    expiryWarnDays: number;
  };
  topAlerts: Array<{
    id: string;
    menuId: string;
    menuName: string;
    category: string | null;
    status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
    currentPrice: string;
    recommendedPrice: string;
    marginBeforePct: string;
    marginAfterPct: string;
    targetPct: string;
    ingredientCostBefore: string;
    ingredientCostAfter: string;
    fullCostBefore: string;
    fullCostAfter: string;
    createdAt: string;
  }>;
  lowestCapacityMenus: Array<{
    id: string;
    name: string;
    category: string | null;
    sellingPrice: string;
    capacity: number;
    hasRecipe: boolean;
    bottleneckIngredient: {
      id: string;
      name: string;
      remainingStock: string;
      unit: string;
    } | null;
  }>;
  recentSales: Array<{
    id: string;
    invoiceNo: string;
    soldAt: string;
    totalAmount: string;
    paymentMethod: string;
    cashierName: string;
    itemCount: number;
  }>;
  isNewBusiness: boolean;
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () => apiClient<DashboardSummaryData>("/dashboard/summary"),
  });
}
