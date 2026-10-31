import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export interface BusinessSettings {
  id: string;
  name: string;
  isDemo: boolean;
  targetMarginDefault: string;
  priceRoundingStep: number;
  expectedMonthlyPortions: number;
  expiryWarnDays: number;
  wastePromoMinMargin: string;
  timezone: string;
  createdAt: string;
}

export interface UpdateSettingsPayload {
  name?: string;
  targetMarginDefault?: number | string;
  priceRoundingStep?: number;
  expectedMonthlyPortions?: number;
  expiryWarnDays?: number;
  wastePromoMinMargin?: number | string;
  timezone?: string;
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.detail(),
    queryFn: () => apiClient<BusinessSettings>("/api/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSettingsPayload) =>
      apiClient<BusinessSettings>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.overheads.all });
    },
  });
}
