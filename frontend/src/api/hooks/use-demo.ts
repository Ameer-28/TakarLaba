import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "../keys";
import { toast } from "sonner";

export interface DemoStatus {
  enabled: boolean;
  cooldownSeconds: number;
}

export interface DemoResetResult {
  message: string;
  resetAt: string;
}

export interface DemoLoginResult {
  user: unknown;
  session: unknown;
  role: "OWNER" | "CASHIER";
}

/**
 * Hook to check if demo mode is enabled and get current cooldown seconds.
 */
export function useDemoStatus() {
  return useQuery({
    queryKey: queryKeys.demo.status(),
    queryFn: () => apiClient<DemoStatus>("/api/demo/status"),
    staleTime: 5000,
  });
}

/**
 * Hook to reset demo business data back to original PRD Lampiran B fixture state.
 */
export function useDemoReset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient<DemoResetResult>("/api/demo/reset", {
        method: "POST",
      }),
    onSuccess: (data) => {
      toast.success("Data contoh berhasil diisi ulang", {
        description: data.message,
      });
      // Invalidate all query caches so UI updates with fresh seed data
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Gagal mereset data demo";
      toast.error("Gagal reset data demo", { description: msg });
    },
  });
}

/**
 * Hook to sign in as Demo Owner or Demo Cashier via the backend demo login endpoint.
 */
export function useDemoLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: "OWNER" | "CASHIER") =>
      apiClient<DemoLoginResult>("/api/demo/login", {
        method: "POST",
        body: JSON.stringify({ role }),
      }),
    onSuccess: (data) => {
      toast.success(`Berhasil masuk sebagai Demo ${data.role === "OWNER" ? "Owner" : "Kasir"}`);
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Gagal masuk sebagai user demo";
      toast.error("Login demo gagal", { description: msg });
    },
  });
}
