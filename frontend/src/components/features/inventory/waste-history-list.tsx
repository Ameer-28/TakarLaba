import { Trash2, Loader2, AlertCircle, Calendar, User } from "lucide-react";
import { useWasteHistory } from "@/api/hooks/use-inventory";
import { formatNumber, formatRupiah, formatDate } from "@/lib/format";

interface WasteHistoryListProps {
  onOpenRecordModal: () => void;
}

export function WasteHistoryList({ onOpenRecordModal }: WasteHistoryListProps) {
  const {
    data: history = [],
    isPending,
    isError,
    error,
    refetch,
  } = useWasteHistory({
    limit: 50,
  });

  const totalLoss = history.reduce((sum, item) => sum + Number(item.wastedValue), 0);

  if (isPending) {
    return (
      <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
        <p className="text-xs sm:text-sm text-slate-500">Loading waste history...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center space-y-3 bg-rose-50/50 rounded-2xl border border-rose-200">
        <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
        <p className="text-sm font-semibold text-rose-800">Failed to load waste history</p>
        <p className="text-xs text-rose-600">
          {error instanceof Error ? error.message : "Internal server error occurred"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50"
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
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Food Waste Loss</div>
            <div className="text-xl font-black text-rose-600 font-mono tabular-nums">
              {formatRupiah(totalLoss)}
            </div>
          </div>
        </div>
        <button
          onClick={onOpenRecordModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Record Food Waste</span>
        </button>
      </div>

      {/* History Items */}
      {history.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <Trash2 className="w-10 h-10 mx-auto text-slate-300" />
          <h4 className="text-sm font-bold text-slate-700">No Food Waste Recorded</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All ingredients are intact. Click the button above to record spoiled, spilled, or
            expired items.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {item.ingredientName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Wasted: {formatNumber(Number(item.qtyBase))} {item.baseUnit.toLowerCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 italic">&ldquo;{item.reason}&rdquo;</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(item.createdAt)}</span>
                  </span>
                  {item.createdByName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Recorded by: {item.createdByName}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs text-slate-400">Financial Loss</div>
                <div className="text-base sm:text-lg font-bold text-rose-600 font-mono tabular-nums">
                  {formatRupiah(Number(item.wastedValue))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
