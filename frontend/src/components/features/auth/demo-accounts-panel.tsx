import { useState, useEffect } from "react";
import { ChefHat, Store, RotateCcw, Loader2 } from "lucide-react";
import { useDemoStatus, useDemoReset } from "@/api/hooks/use-demo";
import { isDemoActive, formatResetButtonText } from "./demo-utils";

interface DemoAccountsPanelProps {
  onDemoLogin: (role: "owner" | "cashier") => Promise<void>;
  isSubmitting: boolean;
  submittingRole: "owner" | "cashier" | null;
}

export function DemoAccountsPanel({
  onDemoLogin,
  isSubmitting,
  submittingRole,
}: DemoAccountsPanelProps) {
  const { data: demoStatus, isPending: isStatusPending } = useDemoStatus();
  const resetMutation = useDemoReset();

  const [cooldown, setCooldown] = useState<number>(0);

  // Sync cooldown from server data
  useEffect(() => {
    if (demoStatus?.cooldownSeconds) {
      setCooldown(demoStatus.cooldownSeconds);
    }
  }, [demoStatus?.cooldownSeconds]);

  // Local 1-second countdown interval
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // If status is loading or demo mode is disabled, do not render panel
  if (isStatusPending || !isDemoActive(demoStatus)) {
    return null;
  }

  const handleResetData = async () => {
    if (cooldown > 0 || resetMutation.isPending || isSubmitting) return;
    try {
      await resetMutation.mutateAsync();
      setCooldown(60); // 60s cooldown after trigger
    } catch {
      // toast is already handled in mutation
    }
  };

  const isResetting = resetMutation.isPending;
  const isAnyActionBusy = isSubmitting || isResetting;

  return (
    <div className="mt-8">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-500 font-medium tracking-wider">
            Akses Cepat Demo
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={isAnyActionBusy}
            onClick={() => onDemoLogin("owner")}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 transition-all text-left"
          >
            {submittingRole === "owner" ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600 flex-shrink-0" />
            ) : (
              <ChefHat className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span className="truncate">Masuk sebagai Demo Owner</span>
          </button>

          <button
            type="button"
            disabled={isAnyActionBusy}
            onClick={() => onDemoLogin("cashier")}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 transition-all text-left"
          >
            {submittingRole === "cashier" ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
            ) : (
              <Store className="w-4 h-4 text-blue-600 flex-shrink-0" />
            )}
            <span className="truncate">Masuk sebagai Demo Kasir</span>
          </button>
        </div>

        <button
          type="button"
          disabled={isAnyActionBusy || cooldown > 0}
          onClick={handleResetData}
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 transition-all"
        >
          {isResetting ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-700 flex-shrink-0" />
          ) : (
            <RotateCcw className="w-4 h-4 text-amber-700 flex-shrink-0" />
          )}
          <span>{formatResetButtonText(cooldown, isResetting)}</span>
        </button>
      </div>

      <p className="mt-2.5 text-center text-[11px] text-slate-400">
        Khusus evaluasi juri GTNIC 2026. Mode demo memuat data fiktif deterministik.
      </p>
    </div>
  );
}
