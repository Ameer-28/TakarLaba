import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "../keys";

export interface WasteRadarRelatedMenu {
  menuId: string;
  menuName: string;
  category: string | null;
  sellingPrice: string;
  hppPenuh: string;
  currentMarginPercent: string;
  promoFloorPrice: string;
  maxDiscountAmount: string;
  maxDiscountPercent: string;
  promoMarginPercent: string;
}

export interface WasteRadarItem {
  batchId: string;
  ingredientId: string;
  ingredientName: string;
  category: string | null;
  remainingQty: string;
  unit: string;
  costPerBase: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: "EXPIRED" | "EXPIRING_SOON";
  riskValue: string;
  relatedMenus: WasteRadarRelatedMenu[];
}

export interface WasteRadarSummary {
  totalRiskValue: string;
  totalExpiringBatches: number;
  totalImpactedMenus: number;
  warnDays: number;
  wastePromoMinMarginPercent: string;
}

export interface WasteRadarData {
  summary: WasteRadarSummary;
  items: WasteRadarItem[];
}

export function useWasteRadar(days?: number) {
  return useQuery({
    queryKey: queryKeys.analytics.wasteRadar(days),
    queryFn: () => {
      const queryParam = days ? `?days=${days}` : "";
      return apiClient<WasteRadarData>(`/analytics/waste-radar${queryParam}`);
    },
    staleTime: 30_000,
  });
}
