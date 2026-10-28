import { ChefHat, Store, Loader2 } from "lucide-react";

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
  return (
    <div className="mt-8">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-500 font-medium tracking-wider">
            Atau Akses Akun Demo
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onDemoLogin("owner")}
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 transition-all text-left"
        >
          {submittingRole === "owner" ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <ChefHat className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span className="truncate">Demo Owner</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onDemoLogin("cashier")}
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 transition-all text-left"
        >
          {submittingRole === "cashier" ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Store className="w-4 h-4 text-blue-600 flex-shrink-0" />
          )}
          <span className="truncate">Demo Kasir</span>
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        Akses cepat instan untuk evaluasi juri GTNIC 2026
      </p>
    </div>
  );
}
