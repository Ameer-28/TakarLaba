import { CheckCircle2, AlertTriangle, AlertOctagon, AlertCircle, BookOpen } from "lucide-react";
import type { MenuCostSummary, MarginStatus } from "../../../api/hooks/use-menus.js";
import { formatRupiah } from "../../../lib/format.js";

interface MarginBadgeProps {
  costSummary?: MenuCostSummary | null;
  hasRecipe: boolean;
  targetMargin?: string | null;
  defaultBusinessMargin?: string;
  size?: "sm" | "md";
  className?: string;
}

export function MarginBadge({
  costSummary,
  hasRecipe,
  targetMargin,
  defaultBusinessMargin = "50",
  size = "sm",
  className = "",
}: MarginBadgeProps) {
  const effectiveTarget = targetMargin ?? defaultBusinessMargin;

  // Case 1: Menu does not have a recipe yet
  if (!hasRecipe || !costSummary) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-lg border transition-colors ${
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
        } bg-slate-50 text-slate-600 border-slate-200/80 ${className}`}
        title="Menu does not have recipe ingredients configured yet"
      >
        <BookOpen className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        <span>Recipe Needed</span>
      </span>
    );
  }

  // Case 2: Menu has recipe but some ingredients have never been purchased (BR-04, FR-COST-01)
  if (!costSummary.isCostComplete || costSummary.marginStatus === "INCOMPLETE") {
    const missingIngredientsText =
      costSummary.missingCostIngredients && costSummary.missingCostIngredients.length > 0
        ? `No purchase history for: ${costSummary.missingCostIngredients.join(", ")}`
        : "Some recipe ingredients have no purchase records";

    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-lg border transition-colors ${
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
        } bg-amber-50 text-amber-800 border-amber-300/80 shadow-2xs ${className}`}
        title={missingIngredientsText}
      >
        <AlertCircle
          className={size === "sm" ? "w-3.5 h-3.5 text-amber-600" : "w-4 h-4 text-amber-600"}
        />
        <span>Incomplete Cost Data</span>
      </span>
    );
  }

  // Case 3: Complete costing according to BR-09
  const status: MarginStatus = costSummary.marginStatus;
  const marginPct = costSummary.marginPercent ?? "0.00";
  const hppPenuhText = costSummary.hppPenuh ? formatRupiah(costSummary.hppPenuh) : "-";

  if (status === "AMAN") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-lg border transition-colors ${
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
        } bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs ${className}`}
        title={`Safe: Margin ${marginPct}% meets or exceeds target ${effectiveTarget}% (Full Cost: ${hppPenuhText})`}
      >
        <CheckCircle2
          className={size === "sm" ? "w-3.5 h-3.5 text-emerald-600" : "w-4 h-4 text-emerald-600"}
        />
        <span className="tabular-nums">Safe ({marginPct}%)</span>
      </span>
    );
  }

  if (status === "WASPADA") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-lg border transition-colors ${
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
        } bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs ${className}`}
        title={`Warning: Margin ${marginPct}% is below target ${effectiveTarget}% but within 5 pp (Full Cost: ${hppPenuhText})`}
      >
        <AlertTriangle
          className={size === "sm" ? "w-3.5 h-3.5 text-amber-600" : "w-4 h-4 text-amber-600"}
        />
        <span className="tabular-nums">Warning ({marginPct}%)</span>
      </span>
    );
  }

  // status === "BAHAYA"
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg border transition-colors ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs ${className}`}
      title={`Critical: Margin ${marginPct}% is more than 5 pp below target ${effectiveTarget}% (Full Cost: ${hppPenuhText})`}
    >
      <AlertOctagon
        className={size === "sm" ? "w-3.5 h-3.5 text-rose-600" : "w-4 h-4 text-rose-600"}
      />
      <span className="tabular-nums">Critical ({marginPct}%)</span>
    </span>
  );
}
