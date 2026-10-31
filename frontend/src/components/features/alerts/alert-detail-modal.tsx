import { X, TrendingUp, Scissors, AlertTriangle, Check } from "lucide-react";
import { formatRupiah, formatPercent, formatQuantity, formatDate } from "@/lib/format";
import { useAlertDetail, useApplyAlertPrice } from "@/api/hooks/use-alerts";
import { toast } from "sonner";

interface AlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertId: string | null;
}

export function AlertDetailModal({ isOpen, onClose, alertId }: AlertDetailModalProps) {
  const { data: alert, isPending, isError } = useAlertDetail(alertId || "");
  const applyPriceMutation = useApplyAlertPrice();

  if (!isOpen || !alertId) return null;

  const handleApplyPrice = async () => {
    if (!alert) return;
    try {
      await applyPriceMutation.mutateAsync(alert.id);
      toast.success(
        `Harga menu "${alert.menuName}" berhasil dinaikkan ke ${formatRupiah(alert.optionA.recommendedPrice)}`
      );
      onClose();
    } catch {
      toast.error(`Gagal menerapkan harga baru untuk "${alert.menuName}".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Detail Peringatan Margin
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {alert ? alert.menuName : "Memuat data..."}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          {isPending ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Memuat rincian peringatan...
            </div>
          ) : isError || !alert ? (
            <div className="py-12 text-center text-xs text-rose-500">
              Gagal memuat rincian peringatan.
            </div>
          ) : (
            <>
              {/* Trigger & Status info */}
              <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-100 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-xs font-bold text-rose-900">
                    Pemicu: Kenaikan Harga {alert.triggerIngredient?.name || "Bahan Baku"}
                  </span>
                </div>
                <p className="text-xs text-rose-800">
                  {alert.triggerPurchase ? (
                    <>
                      Tercatat pada nota pembelian dari{" "}
                      <strong>{alert.triggerPurchase.supplierName || "Pemasok Langsung"}</strong>{" "}
                      pada {formatDate(alert.triggerPurchase.purchasedAt, true)}.
                    </>
                  ) : (
                    "Tercatat melalui perubahan data resep atau pengaturan usaha."
                  )}
                </p>
              </div>

              {/* Cost comparison metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">HPP Bahan</span>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 tabular-nums">
                    {formatRupiah(alert.costs.ingredientCostBefore)} →{" "}
                    <span className="text-rose-600 font-extrabold">
                      {formatRupiah(alert.costs.ingredientCostAfter)}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">HPP Penuh</span>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 tabular-nums">
                    {formatRupiah(alert.costs.fullCostBefore)} →{" "}
                    <span className="text-rose-600 font-extrabold">
                      {formatRupiah(alert.costs.fullCostAfter)}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">Margin Penuh</span>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 tabular-nums">
                    {formatPercent(alert.costs.marginBeforePct)} →{" "}
                    <span className="text-rose-600 font-extrabold">
                      {formatPercent(alert.costs.marginAfterPct)}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">
                    Target Margin
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums">
                    {formatPercent(alert.costs.targetPct)}
                  </span>
                </div>
              </div>

              {/* Recipe Breakdown */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Komposisi Resep Produk
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {alert.recipe.map((item) => {
                    const isTrigger = item.ingredientId === alert.triggerIngredient?.id;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 ${
                          isTrigger
                            ? "bg-rose-50/60 font-semibold text-rose-950"
                            : "bg-white text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isTrigger && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-200 text-rose-800">
                              PEMICU
                            </span>
                          )}
                          <span>{item.ingredientName}</span>
                        </div>
                        <span className="tabular-nums font-bold text-slate-900">
                          {formatQuantity(item.amount, item.unit)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Option A */}
                <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Opsi A: Naikkan Harga
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900 tabular-nums">
                      {formatRupiah(alert.optionA.recommendedPrice)}
                    </span>
                    <span className="text-xs font-semibold text-sky-700">
                      (+{formatRupiah(alert.optionA.priceIncrease)})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Proyeksi margin pulih ke{" "}
                    <strong>{formatPercent(alert.optionA.projectedMarginPercent)}</strong>.
                  </p>
                </div>

                {/* Option B */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold uppercase tracking-wider">
                    <Scissors className="w-3.5 h-3.5" />
                    Opsi B: Kurangi Takaran
                  </div>
                  {alert.optionB ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-slate-900 tabular-nums">
                          {formatQuantity(alert.optionB.newTakaran, alert.optionB.unit)}
                        </span>
                        <span className="text-xs font-semibold text-amber-600">
                          (-{formatQuantity(alert.optionB.reducedAmount, alert.optionB.unit)})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Hemat biaya {formatRupiah(alert.optionB.costSavingNeeded)} (
                        {formatPercent(alert.optionB.reductionPercent)} porsi{" "}
                        {alert.triggerIngredient?.name}).
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Data bahan baku tidak lengkap untuk opsi B.
                    </p>
                  )}
                </div>
              </div>

              {/* Status / Note if resolved */}
              {alert.status === "RESOLVED" && (
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-800">
                    Status Penyelesaian: {alert.resolution}
                  </span>
                  {alert.note && <p className="italic">"{alert.note}"</p>}
                  {alert.resolvedAt && (
                    <p className="text-[11px] text-slate-400">
                      Diselesaikan pada {formatDate(alert.resolvedAt, true)}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
          {alert && alert.status !== "RESOLVED" && (
            <button
              type="button"
              disabled={applyPriceMutation.isPending}
              onClick={handleApplyPrice}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Harga {formatRupiah(alert.optionA.recommendedPrice)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
