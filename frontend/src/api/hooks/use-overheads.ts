import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client.js";
import { queryKeys } from "../keys.js";

export type OverheadType = "UTILITY" | "LABOR" | "DEPRECIATION" | "OTHER";

export interface OverheadCost {
  id: string;
  businessId: string;
  name: string;
  type: OverheadType;
  monthlyAmount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OverheadsResponse {
  items: OverheadCost[];
  totalMonthlyOverhead: string;
  expectedMonthlyPortions: number;
  overheadPerPortion: string;
}

export interface CreateOverheadPayload {
  name: string;
  type: OverheadType;
  monthlyAmount: number | string;
  isActive?: boolean;
}

export interface UpdateOverheadPayload {
  name?: string;
  type?: OverheadType;
  monthlyAmount?: number | string;
  isActive?: boolean;
}

export function useOverheads(filter?: { isActive?: boolean }) {
  return useQuery({
    queryKey: queryKeys.overheads.list(filter),
    queryFn: () => {
      const params: Record<string, boolean | undefined> = {};
      if (filter?.isActive !== undefined) {
        params.isActive = filter.isActive;
      }
      return apiClient<OverheadsResponse>("/api/overheads", { params });
    },
  });
}

export function useCreateOverhead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOverheadPayload) =>
      apiClient<OverheadCost>("/api/overheads", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.overheads.all });
    },
  });
}

export function useUpdateOverhead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOverheadPayload }) =>
      apiClient<OverheadCost>(`/api/overheads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.overheads.all });
    },
  });
}

export function useDeleteOverhead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ success: boolean }>(`/api/overheads/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.overheads.all });
    },
  });
}
