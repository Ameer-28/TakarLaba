import { ChefHat, Store, Loader2 } from "lucide-react";
import { useDemoStatus } from "@/api/hooks/use-demo";
import { isDemoActive } from "./demo-utils";

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

  // If status is loading or demo mode is disabled, do not render panel
  if (isStatusPending || !isDemoActive(demoStatus)) {
    return null;
  }

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
            disabled={isSubmitting}
            onClick={() => onDemoLogin("owner")}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 transition-all text-left cursor-pointer"
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
            disabled={isSubmitting}
            onClick={() => onDemoLogin("cashier")}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 transition-all text-left cursor-pointer"
          >
            {submittingRole === "cashier" ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
            ) : (
              <Store className="w-4 h-4 text-blue-600 flex-shrink-0" />
            )}
            <span className="truncate">Masuk sebagai Demo Kasir</span>
          </button>
        </div>
      </div>

      <p className="mt-2.5 text-center text-[11px] text-slate-400">
        Khusus evaluasi juri GTNIC 2026. Masuk sebagai Pemilik untuk melakukan reset data.
      </p>
    </div>
  );
}
