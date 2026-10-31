import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  X,
  TrendingUp,
  Scissors,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { formatRupiah, formatPercent, formatQuantity } from "@/lib/format";
import { useApplyAlertPrice, type ImpactedMenuAlert } from "@/api/hooks/use-alerts";

interface PriceShockImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: ImpactedMenuAlert[];
}

export function PriceShockImpactModal({ isOpen, onClose, alerts }: PriceShockImpactModalProps) {
  const [appliedAlertIds, setAppliedAlertIds] = useState<Set<string>>(new Set());
  const applyPriceMutation = useApplyAlertPrice();

  if (!isOpen || alerts.length === 0) return null;

  const handleApplyPrice = async (alert: ImpactedMenuAlert) => {
    try {
      await applyPriceMutation.mutateAsync(alert.alertId);
      setAppliedAlertIds((prev) => new Set(prev).add(alert.alertId));
      toast.success(
        `Harga menu "${alert.menuName}" berhasil dinaikkan ke ${formatRupiah(alert.optionA.recommendedPrice)}`
      );
    } catch {
      toast.error(`Gagal menerapkan harga baru untuk "${alert.menuName}".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 bg-rose-50/80 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Dampak Kenaikan Harga Terdeteksi
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {alerts.length} Menu Terdampak
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Kenaikan harga beli bahan baku menurunkan margin produk di bawah target batas
                bisnis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-lg transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto divide-y divide-slate-100">
          {alerts.map((alert) => {
            const isApplied = appliedAlertIds.has(alert.alertId);

            return (
              <div key={alert.alertId} className="pt-6 first:pt-0 space-y-4">
                {/* Menu Title & Trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {alert.menuName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Bahan pemicu:{" "}
                      <span className="font-semibold text-slate-700">
                        {alert.triggerIngredientName}
                      </span>{" "}
                      · Harga jual saat ini:{" "}
                      <span className="font-semibold text-slate-700">
                        {formatRupiah(alert.sellingPrice)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Margin turun:</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 tabular-nums">
                      {formatPercent(alert.costBefore.marginPercent)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 tabular-nums">
                      {formatPercent(alert.costAfter.marginPercent)}
                    </span>
                    <span className="text-xs text-slate-400">
                      (Target {formatPercent(alert.targetMarginPercent)})
                    </span>
                  </div>
                </div>

                {/* Before vs After Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 block">
                      HPP Bahan Awal
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 tabular-nums">
                      {formatRupiah(alert.costBefore.hppBahan)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-rose-600 block">
                      HPP Bahan Baru
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-rose-700 tabular-nums">
                      {formatRupiah(alert.costAfter.hppBahan)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 block">
                      HPP Penuh Awal
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 tabular-nums">
                      {formatRupiah(alert.costBefore.hppPenuh)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-rose-600 block">
                      HPP Penuh Baru
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-rose-700 tabular-nums">
                      {formatRupiah(alert.costAfter.hppPenuh)}
                    </span>
                  </div>
                </div>

                {/* Option A vs Option B Recommendation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {/* Option A: Naikkan Harga */}
                  <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Opsi A: Naikkan Harga Jual
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
                          {formatRupiah(alert.optionA.recommendedPrice)}
                        </span>
                        <span className="text-xs font-semibold text-sky-700">
                          (+{formatRupiah(alert.optionA.priceIncrease)})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Margin pulih ke{" "}
                        <strong className="text-slate-800">
                          {formatPercent(alert.optionA.projectedMarginPercent)}
                        </strong>{" "}
                        ({formatRupiah(alert.optionA.projectedMarginKontribusi)}/porsi).
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isApplied || applyPriceMutation.isPending}
                      onClick={() => handleApplyPrice(alert)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                        isApplied
                          ? "bg-emerald-600 text-white cursor-default"
                          : "bg-sky-600 hover:bg-sky-700 text-white cursor-pointer active:scale-98"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Harga Berhasil Diterapkan
                        </>
                      ) : (
                        <>
                          Terapkan Harga {formatRupiah(alert.optionA.recommendedPrice)}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Option B: Kurangi Takaran */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold uppercase tracking-wider">
                        <Scissors className="w-3.5 h-3.5" />
                        Opsi B: Tahan Harga & Kurangi Takaran
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                          {formatQuantity(alert.optionB.newTakaran, alert.optionB.unit)}
                        </span>
                        <span className="text-xs font-semibold text-amber-600">
                          (-{formatQuantity(alert.optionB.reducedAmount, alert.optionB.unit)})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Hemat biaya {formatRupiah(alert.optionB.costSavingNeeded)} dengan mengurangi
                        porsi {alert.triggerIngredientName} sebesar{" "}
                        {formatPercent(alert.optionB.reductionPercent)}.
                      </p>
                    </div>

                    <div>
                      {alert.optionB.isFeasible ? (
                        <div className="text-[11px] px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                          ✓ Pengurangan ≤ 50%, profil rasa menu tetap stabil.
                        </div>
                      ) : (
                        <div className="text-[11px] px-2.5 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                          ⚠️{" "}
                          {alert.optionB.infeasibleReason ??
                            "Pengurangan > 50%, rasa akan berubah drastis."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to="/alerts"
            onClick={onClose}
            className="text-xs sm:text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            Buka Pusat Peringatan
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-98"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
