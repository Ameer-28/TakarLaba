import { X, Clock, Ban, AlertCircle } from "lucide-react";
import type { PurchaseRecord } from "@/api/hooks/use-purchases";
import { formatRupiah, formatNumber, formatDate } from "@/lib/format";

interface PurchaseBatchDetailModalProps {
  purchase: PurchaseRecord | null;
  onClose: () => void;
  onOpenVoid?: (purchase: PurchaseRecord) => void;
}

export function PurchaseBatchDetailModal({
  purchase,
  onClose,
  onOpenVoid,
}: PurchaseBatchDetailModalProps) {
  if (!purchase) return null;

  const isVoided = Boolean(purchase.note?.startsWith("[DIBATALKAN"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Rincian Batch Nota Belanja</h3>
              {isVoided && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  <Ban className="w-3 h-3" />
                  <span>Dibatalkan</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {purchase.supplierName || "Pembelian Umum"} • {formatDate(purchase.purchasedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isVoided && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Nota belanja ini telah dibatalkan</span>
                <span className="text-[11px] text-rose-700 italic">
                  {purchase.note || "Dibatalkan oleh pemilik"}
                </span>
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Total Belanja</span>
              <span className="font-bold text-slate-900 text-sm tabular-nums">
                {formatRupiah(Number(purchase.totalAmount))}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Dicatat Oleh</span>
              <span className="font-semibold text-slate-700">
                {purchase.createdBy?.name || "Pemilik"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Batch Persediaan Yang Dihasilkan ({purchase.batches.length})
            </span>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {purchase.batches.map((batch) => {
                const costPerBaseNum = Number(batch.costPerBase);
                const initialQtyNum = Number(batch.initialQtyBase);
                const remainingQtyNum = Number(batch.remainingQtyBase);
                const purchaseQtyNum = Number(batch.purchaseQty);
                const unitPriceNum = Number(batch.purchaseUnitPrice);

                return (
                  <div key={batch.id} className="p-3 bg-white hover:bg-slate-50/60 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {batch.ingredient.name}
                          </span>
                          {batch.expiryDate && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Exp: {formatDate(batch.expiryDate)}</span>
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-slate-500">
                          Beli: {formatNumber(purchaseQtyNum)} {batch.purchaseUnit} @{" "}
                          {formatRupiah(unitPriceNum)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900 text-sm tabular-nums block">
                          {formatRupiah(purchaseQtyNum * unitPriceNum)}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-mono">
                          {formatRupiah(costPerBaseNum, true)} /{" "}
                          {batch.ingredient.baseUnit.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <span>
                        Konversi Satuan Dasar:{" "}
                        <span className="font-mono font-bold text-slate-800">
                          {formatNumber(initialQtyNum)} {batch.ingredient.baseUnit.toLowerCase()}
                        </span>
                        {!isVoided && remainingQtyNum < initialQtyNum && (
                          <span className="text-slate-400 ml-1.5">
                            (tersisa {formatNumber(remainingQtyNum)})
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-slate-400">ID: #{batch.id.slice(-6)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            {!isVoided && onOpenVoid && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVoid(purchase);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Batalkan Nota Ini</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
