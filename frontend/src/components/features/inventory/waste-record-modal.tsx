import { useState, useMemo } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
  useInventoryBatches,
  useRecordWaste,
  type StockBatchItem,
} from "@/api/hooks/use-inventory";
import { formatRupiah, formatNumber, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface WasteRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBatch?: StockBatchItem | null;
  onSuccess?: () => void;
}

export function WasteRecordModal({
  isOpen,
  onClose,
  initialBatch,
  onSuccess,
}: WasteRecordModalProps) {
  const { data: batches = [], isPending: isBatchesPending } = useInventoryBatches({
    hasRemainingOnly: true,
  });

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [qty, setQty] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const activeBatch = useMemo(() => {
    if (initialBatch) return initialBatch;
    return batches.find((b) => b.id === selectedBatchId) ?? batches[0] ?? null;
  }, [initialBatch, batches, selectedBatchId]);

  const currentBatchId = initialBatch ? initialBatch.id : selectedBatchId || activeBatch?.id || "";

  const currentBatch = useMemo(() => {
    return batches.find((b) => b.id === currentBatchId) ?? initialBatch ?? null;
  }, [batches, currentBatchId, initialBatch]);

  const costPerBaseNum = currentBatch?.costPerBase ? Number(currentBatch.costPerBase) : 0;
  const remainingNum = currentBatch ? Number(currentBatch.remainingQtyBase) : 0;
  const qtyNum = Number(qty) || 0;

  const estimatedLoss = useMemo(() => {
    if (qtyNum <= 0 || !costPerBaseNum) return 0;
    return Math.round(qtyNum * costPerBaseNum);
  }, [qtyNum, costPerBaseNum]);

  const isExceeded = qtyNum > remainingNum;
  const isReasonValid = reason.trim().length >= 3;
  const canSubmit = currentBatch && qtyNum > 0 && !isExceeded && isReasonValid;

  const recordMutation = useRecordWaste();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !currentBatch) return;

    try {
      const res = await recordMutation.mutateAsync({
        batchId: currentBatch.id,
        qty: qtyNum,
        reason: reason.trim(),
      });

      toast.success(
        `Wasted ingredient recorded: ${res.ingredientName} (${formatNumber(Number(res.qtyBase))} ${res.baseUnit.toLowerCase()}) valued at ${formatRupiah(Number(res.wastedValue))}`
      );
      setQty("");
      setReason("");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record ingredient waste");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Record Wasted Ingredients (Waste)
              </h3>
              <p className="text-xs text-slate-500">
                Allocate wasted stock due to spoilage, damage, or expiration (FR-INV-03)
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Batch Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Ingredient Batch <span className="text-rose-500">*</span>
            </label>
            {initialBatch ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{initialBatch.ingredientName}</div>
                <div className="text-slate-500 flex justify-between">
                  <span>
                    Remaining: {formatNumber(Number(initialBatch.remainingQtyBase))}{" "}
                    {initialBatch.baseUnit.toLowerCase()}
                  </span>
                  {initialBatch.expiryDate && (
                    <span>Exp: {formatDate(initialBatch.expiryDate)}</span>
                  )}
                </div>
              </div>
            ) : isBatchesPending ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Loading active batch list...</span>
              </div>
            ) : batches.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                No active batches with remaining stock to record waste for.
              </div>
            ) : (
              <select
                value={currentBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ingredientName} — Remaining: {formatNumber(Number(b.remainingQtyBase))}{" "}
                    {b.baseUnit.toLowerCase()} (
                    {b.expiryDate ? `Exp: ${formatDate(b.expiryDate)}` : "No Expiry"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Wasted Quantity ({currentBatch?.baseUnit.toLowerCase() ?? "unit"}){" "}
                <span className="text-rose-500">*</span>
              </label>
              {currentBatch && (
                <span className="text-[11px] text-slate-500">
                  Maximum: {formatNumber(remainingNum)} {currentBatch.baseUnit.toLowerCase()}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.001"
                max={remainingNum}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
                className={`w-full text-sm px-3.5 py-2.5 rounded-xl border bg-white focus:outline-hidden focus:ring-2 tabular-nums ${
                  isExceeded
                    ? "border-rose-400 focus:ring-rose-400 text-rose-700"
                    : "border-slate-200 focus:ring-rose-500"
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 uppercase">
                {currentBatch?.baseUnit ?? ""}
              </span>
            </div>
            {isExceeded && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Quantity exceeds available batch stock.
              </p>
            )}
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Waste Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Milk spoiled due to power outage, packaging torn, spilled..."
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
            />
            {reason.length > 0 && !isReasonValid && (
              <p className="text-[11px] text-rose-600 mt-1">
                Reason must be at least 3 characters.
              </p>
            )}
          </div>

          {/* Financial Loss Preview Card */}
          {currentBatch && qtyNum > 0 && !isExceeded && (
            <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-800 font-medium">Estimated Financial Loss:</span>
                <span className="text-sm font-bold text-rose-700 font-mono tabular-nums">
                  {formatRupiah(estimatedLoss)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-rose-600">
                <span>Remaining stock after disposal:</span>
                <span className="font-semibold tabular-nums">
                  {formatNumber(remainingNum - qtyNum)} {currentBatch.baseUnit.toLowerCase()}
                </span>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={recordMutation.isPending}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || recordMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {recordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Record Waste</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
