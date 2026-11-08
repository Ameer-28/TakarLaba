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
    <div className="w-full">
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-card px-2.5 text-muted-foreground font-semibold tracking-wider">
            Demo Access
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onDemoLogin("owner")}
          className="inline-flex items-center justify-center gap-1.5 h-[30px] px-2 border border-slate-200 rounded-[3.5px] text-[10px] font-medium text-slate-700 bg-white/60 hover:bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#11212D]/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {submittingRole === "owner" ? (
            <Loader2 className="w-3 h-3 animate-spin text-[#11212D] flex-shrink-0" />
          ) : (
            <ChefHat className="w-3 h-3 text-[#11212D] flex-shrink-0" />
          )}
          <span className="truncate">Demo Owner</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onDemoLogin("cashier")}
          className="inline-flex items-center justify-center gap-1.5 h-[30px] px-2 border border-slate-200 rounded-[3.5px] text-[10px] font-medium text-slate-700 bg-white/60 hover:bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#11212D]/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {submittingRole === "cashier" ? (
            <Loader2 className="w-3 h-3 animate-spin text-[#253745] flex-shrink-0" />
          ) : (
            <Store className="w-3 h-3 text-[#253745] flex-shrink-0" />
          )}
          <span className="truncate">Demo Cashier</span>
        </button>
      </div>
    </div>
  );
}
