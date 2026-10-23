import { X, Loader2, Calendar } from "lucide-react";
import type { IngredientStockSummary, StockBatchItem } from "@/api/hooks/use-inventory";
import { formatNumber, formatRupiah, formatDate } from "@/lib/format";
import { STATUS_BADGES } from "./types";

interface InventoryBatchModalProps {
  ingredient: IngredientStockSummary | null;
  onClose: () => void;
  batches: StockBatchItem[];
  isPending: boolean;
  isOwner: boolean;
}

export function InventoryBatchModal({
  ingredient,
  onClose,
  batches,
  isPending,
  isOwner,
}: InventoryBatchModalProps) {
  if (!ingredient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900">
              Urutan Batch FEFO: {ingredient.name}
            </h3>
            <p className="text-xs text-slate-500">
              Stok akan terpotong otomatis dari batch yang paling awal kedaluwarsa saat penjualan
              POS.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isPending ? (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs text-slate-500">Memuat rincian batch...</p>
            </div>
          ) : batches.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">
              Tidak ada batch aktif dengan sisa stok untuk bahan ini.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {batches.map((batch, idx) => {
                const statusMeta = STATUS_BADGES[batch.status];
                const remainingNum = Number(batch.remainingQtyBase);
                const initialNum = Number(batch.initialQtyBase);
                const costNum = batch.costPerBase ? Number(batch.costPerBase) : null;

                return (
                  <div key={batch.id} className="p-3.5 bg-white hover:bg-slate-50/60 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold font-mono flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.badgeClass}`}
                          >
                            {statusMeta.label}
                          </span>
                          {batch.expiryDate ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Kedaluwarsa: {formatDate(batch.expiryDate)}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Tanpa Kedaluwarsa</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Diterima: {formatDate(batch.receivedAt)}</span>
                          {batch.supplierName && <span>• Dari: {batch.supplierName}</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900 text-sm tabular-nums block">
                          Sisa: {formatNumber(remainingNum)} / {formatNumber(initialNum)}{" "}
                          {batch.baseUnit.toLowerCase()}
                        </span>
                        {isOwner && costNum !== null && (
                          <span className="text-[11px] text-emerald-700 font-mono">
                            {formatRupiah(costNum, true)} / {batch.baseUnit.toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
