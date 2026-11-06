import { useState, useMemo } from "react";
import {
  X,
  SlidersHorizontal,
  Loader2,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
} from "lucide-react";
import {
  useInventoryBatches,
  useRecordAdjustment,
  type StockBatchItem,
} from "@/api/hooks/use-inventory";
import { formatRupiah, formatNumber, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBatch?: StockBatchItem | null;
  onSuccess?: () => void;
}

const PRESET_REASONS = [
  "Weekly physical stock opname",
  "Spilled / broken during storage",
  "Correction of initial entry typo",
  "Supplier bonus / scale discrepancy",
];

export function StockAdjustmentModal({
  isOpen,
  onClose,
  initialBatch,
  onSuccess,
}: StockAdjustmentModalProps) {
  const { data: batches = [], isPending: isBatchesPending } = useInventoryBatches();

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [actualQty, setActualQty] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const activeBatch = useMemo(() => {
    if (initialBatch) return initialBatch;
    return batches.find((b) => b.id === selectedBatchId) ?? batches[0] ?? null;
  }, [initialBatch, batches, selectedBatchId]);

  const currentBatchId = initialBatch ? initialBatch.id : selectedBatchId || activeBatch?.id || "";

  const currentBatch = useMemo(() => {
    return batches.find((b) => b.id === currentBatchId) ?? initialBatch ?? null;
  }, [batches, currentBatchId, initialBatch]);

  const currentRemainingNum = currentBatch ? Number(currentBatch.remainingQtyBase) : 0;
  const costPerBaseNum = currentBatch?.costPerBase ? Number(currentBatch.costPerBase) : 0;
  const actualQtyNum = actualQty === "" ? NaN : Number(actualQty);

  const delta = useMemo(() => {
    if (isNaN(actualQtyNum)) return 0;
    return actualQtyNum - currentRemainingNum;
  }, [actualQtyNum, currentRemainingNum]);

  const diffValue = useMemo(() => {
    if (isNaN(actualQtyNum) || !costPerBaseNum) return 0;
    return Math.round(delta * costPerBaseNum);
  }, [delta, costPerBaseNum, actualQtyNum]);

  const isDeltaZero = !isNaN(actualQtyNum) && Math.abs(delta) < 0.0001;
  const isActualValid = !isNaN(actualQtyNum) && actualQtyNum >= 0 && !isDeltaZero;
  const isReasonValid = reason.trim().length >= 3;
  const canSubmit = currentBatch && isActualValid && isReasonValid;

  const adjustmentMutation = useRecordAdjustment();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !currentBatch) return;

    try {
      const res = await adjustmentMutation.mutateAsync({
        batchId: currentBatch.id,
        actualQty: actualQtyNum,
        reason: reason.trim(),
      });

      const prefix = Number(res.deltaQtyBase) > 0 ? "+" : "";
      toast.success(
        `Stock adjustment recorded: ${res.ingredientName} (${prefix}${formatNumber(Number(res.deltaQtyBase))} ${res.baseUnit.toLowerCase()}) difference of ${formatRupiah(Number(res.diffValue))}`
      );
      setActualQty("");
      setReason("");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record stock adjustment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-sky-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Stock Adjustment (Physical Opname)
              </h3>
              <p className="text-xs text-slate-500">
                Correct variance between physical inventory and system records (T-204)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Batch Selector if no initialBatch provided */}
          {!initialBatch && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Select Ingredient Batch</label>
              {isBatchesPending ? (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Loading batch list...</span>
                </div>
              ) : (
                <select
                  value={currentBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    setActualQty("");
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all text-slate-800"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.ingredientName} — Remaining: {formatNumber(Number(b.remainingQtyBase))}{" "}
                      {b.baseUnit.toLowerCase()}
                      {b.expiryDate ? ` (Exp: ${formatDate(b.expiryDate)})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Current Batch Info Card */}
          {currentBatch && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {currentBatch.ingredientName}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="font-mono text-slate-400">
                      Batch #{currentBatch.id.slice(-6)}
                    </span>
                    {currentBatch.expiryDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Exp: {formatDate(currentBatch.expiryDate)}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">System Stock</span>
                  <span className="font-extrabold text-slate-900 text-sm tabular-nums">
                    {formatNumber(currentRemainingNum)} {currentBatch.baseUnit.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Physical Count Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Actual Physical Stock (Count Result)
              </label>
              {currentBatch && (
                <span className="text-[11px] text-slate-400 font-medium">
                  Base unit: {currentBatch.baseUnit.toLowerCase()}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={actualQty}
                onChange={(e) => setActualQty(e.target.value)}
                placeholder="0"
                className="w-full pl-3 pr-14 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all font-mono font-bold text-slate-900 placeholder:text-slate-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                {currentBatch?.baseUnit.toLowerCase() ?? ""}
              </div>
            </div>

            {/* Quick Helper Button to copy current system stock */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => setActualQty(currentRemainingNum.toString())}
                className="text-[11px] font-semibold text-slate-500 hover:text-sky-700 underline cursor-pointer"
              >
                Copy system stock ({formatNumber(currentRemainingNum)})
              </button>
            </div>
          </div>

          {/* Calculated Delta Preview Card */}
          {actualQty !== "" && !isNaN(actualQtyNum) && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                delta > 0
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  : delta < 0
                    ? "bg-rose-50/80 border-rose-200 text-rose-950"
                    : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    delta > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : delta < 0
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {delta > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : delta < 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <Scale className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-bold block uppercase tracking-wider opacity-70">
                    {delta > 0
                      ? "Physical Surplus (+)"
                      : delta < 0
                        ? "Shortage / Deficit (-)"
                        : "Matches System Stock"}
                  </span>
                  <span className="text-sm font-extrabold tabular-nums">
                    {delta > 0 ? "+" : ""}
                    {formatNumber(delta)} {currentBatch?.baseUnit.toLowerCase()}
                  </span>
                </div>
              </div>

              {costPerBaseNum > 0 && Math.abs(diffValue) > 0 && (
                <div className="text-right">
                  <span className="text-[11px] font-bold block opacity-70">
                    Difference Valuation
                  </span>
                  <span className="text-sm font-extrabold tabular-nums font-mono">
                    {diffValue > 0 ? "+" : ""}
                    {formatRupiah(diffValue)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Adjustment Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Weekly physical stock count at main kitchen..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all resize-none text-slate-800 placeholder:text-slate-400"
            />

            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_REASONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setReason(p)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    reason === p
                      ? "bg-sky-100 border-sky-300 text-sky-800"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Validation Notice when delta is 0 */}
          {isDeltaZero && (
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              Physical count matches current system stock exactly. No adjustment is required.
            </p>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={adjustmentMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit || adjustmentMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs shadow-sky-600/20 cursor-pointer"
            >
              {adjustmentMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Adjustment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
