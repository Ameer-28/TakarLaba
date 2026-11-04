import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface RegisterOwnerInput {
  name: string;
  businessName: string;
  email: string;
  password: string;
}

export interface RegisterOwnerResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    businessId: string;
    isActive: boolean;
  };
  business: {
    id: string;
    name: string;
    isDemo: boolean;
    targetMarginDefault: string;
    expectedMonthlyPortions: number;
    priceRoundingStep: number;
    expiryWarnDays: number;
  };
}

export function useRegisterOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterOwnerInput) =>
      apiClient<RegisterOwnerResponse>("/api/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
