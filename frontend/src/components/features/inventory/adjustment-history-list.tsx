import {
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useAdjustmentHistory } from "@/api/hooks/use-inventory";
import { formatNumber, formatRupiah, formatDate } from "@/lib/format";

interface AdjustmentHistoryListProps {
  onOpenAdjustmentModal: () => void;
}

export function AdjustmentHistoryList({ onOpenAdjustmentModal }: AdjustmentHistoryListProps) {
  const {
    data: history = [],
    isPending,
    isError,
    error,
    refetch,
  } = useAdjustmentHistory({
    limit: 50,
  });

  const netDiffValue = history.reduce((sum, item) => sum + Number(item.diffValue), 0);

  if (isPending) {
    return (
      <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-600" />
        <p className="text-xs sm:text-sm text-slate-500">Loading stock adjustment history...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center space-y-3 bg-rose-50/50 rounded-2xl border border-rose-200">
        <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
        <p className="text-sm font-semibold text-rose-800">Failed to load adjustment history</p>
        <p className="text-xs text-rose-600">
          {error instanceof Error ? error.message : "Internal server error occurred"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary KPI Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">
              Net Financial Deviation (Physical Opname)
            </div>
            <div
              className={`text-xl font-black font-mono tabular-nums ${
                netDiffValue >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {netDiffValue >= 0 ? "+" : ""}
              {formatRupiah(netDiffValue)}
            </div>
          </div>
        </div>
        <button
          onClick={onOpenAdjustmentModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Adjust Physical Stock</span>
        </button>
      </div>

      {/* History Items */}
      {history.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <SlidersHorizontal className="w-10 h-10 mx-auto text-slate-300" />
          <h4 className="text-sm font-bold text-slate-700">No Adjustment History Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Physical stock has not been adjusted. Perform periodic adjustments when counted stock
            differs from system records.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {history.map((item) => {
            const deltaNum = Number(item.deltaQtyBase);
            const diffValueNum = Number(item.diffValue);
            const isSurplus = deltaNum > 0;

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {item.ingredientName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isSurplus
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {isSurplus ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {isSurplus ? "+" : ""}
                        {formatNumber(deltaNum)} {item.baseUnit.toLowerCase()}
                      </span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 font-medium italic">
                    &ldquo;{item.reason}&rdquo;
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.createdAt)}
                    </span>
                    {item.createdByName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.createdByName}
                      </span>
                    )}
                    {item.expiryDate && <span>Exp: {formatDate(item.expiryDate)}</span>}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Difference Valuation
                  </span>
                  <span
                    className={`font-mono font-bold text-sm sm:text-base tabular-nums ${
                      diffValueNum >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {diffValueNum >= 0 ? "+" : ""}
                    {formatRupiah(diffValueNum)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
