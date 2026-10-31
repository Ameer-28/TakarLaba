import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  TrendingUp,
  FileText,
  Check,
} from "lucide-react";
import { formatRupiah, formatPercent, formatDate } from "@/lib/format";
import type { AlertListItem } from "@/api/hooks/use-alerts";

interface AlertCardProps {
  alert: AlertListItem;
  onApplyPrice: (alert: AlertListItem) => void;
  onAcknowledge: (alert: AlertListItem) => void;
  onDismiss: (alert: AlertListItem) => void;
  onViewDetail: (alert: AlertListItem) => void;
  isApplying: boolean;
}

export function AlertCard({
  alert,
  onApplyPrice,
  onAcknowledge,
  onDismiss,
  onViewDetail,
  isApplying,
}: AlertCardProps) {
  const isOpen = alert.status === "OPEN";
  const isAcknowledged = alert.status === "ACKNOWLEDGED";
  const isResolved = alert.status === "RESOLVED";

  return (
    <div
      className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-xs space-y-4 ${
        isOpen
          ? "border-rose-300 ring-1 ring-rose-200/50"
          : isAcknowledged
            ? "border-amber-200"
            : "border-slate-200 opacity-85"
      }`}
    >
      {/* Header: Menu Name, Selling Price, Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{alert.menu.name}</h3>
            {isOpen && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Perlu Tindakan
              </span>
            )}
            {isAcknowledged && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                <Eye className="w-3 h-3 text-amber-600" />
                Sedang Ditinjau
              </span>
            )}
            {isResolved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Selesai ({alert.resolution})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Harga jual saat ini:{" "}
            <span className="font-semibold text-slate-700">
              {formatRupiah(alert.sellingPriceAtTrigger)}
            </span>
            {alert.triggerIngredient && (
              <>
                {" "}
                · Dipicu kenaikan:{" "}
                <span className="font-semibold text-rose-600">{alert.triggerIngredient.name}</span>
              </>
            )}
          </p>
        </div>

        {/* Trigger purchase timestamp */}
        {alert.triggerPurchase && (
          <div className="text-left sm:text-right text-[11px] text-slate-400">
            <span>Nota: {alert.triggerPurchase.supplierName || "Pemasok"}</span>
            <span className="block">{formatDate(alert.triggerPurchase.purchasedAt)}</span>
          </div>
        )}
      </div>

      {/* Metrics Row: Before vs After vs Target */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
        <div>
          <span className="text-[11px] font-medium text-slate-500 block">HPP Bahan</span>
          <span className="text-xs sm:text-sm font-semibold text-slate-700 tabular-nums">
            {formatRupiah(alert.ingredientCostBefore)} →{" "}
            <strong className="text-rose-600">{formatRupiah(alert.ingredientCostAfter)}</strong>
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-500 block">HPP Penuh</span>
          <span className="text-xs sm:text-sm font-semibold text-slate-700 tabular-nums">
            {formatRupiah(alert.fullCostBefore)} →{" "}
            <strong className="text-rose-600">{formatRupiah(alert.fullCostAfter)}</strong>
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-500 block">Margin Penuh</span>
          <div className="flex items-center justify-center gap-1 text-xs sm:text-sm font-bold tabular-nums">
            <span className="text-slate-600">{formatPercent(alert.marginBeforePct)}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="text-rose-600 font-extrabold">
              {formatPercent(alert.marginAfterPct)}
            </span>
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-500 block">Target Margin</span>
          <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
            {formatPercent(alert.targetPct)}
          </span>
        </div>
      </div>

      {/* Recommendation Summary (Opsi A) */}
      {!isResolved && (
        <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              Rekomendasi Opsi A (Naikkan Harga)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                {formatRupiah(alert.recommendedPrice)}
              </span>
              <span className="text-xs text-sky-700 font-medium">
                (Kembalikan margin ke ambang aman target {formatPercent(alert.targetPct)})
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isApplying}
            onClick={() => onApplyPrice(alert)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Terapkan Harga Ini</span>
          </button>
        </div>
      )}

      {/* Note if resolved */}
      {isResolved && alert.note && (
        <div className="p-2.5 rounded-xl bg-slate-100 text-xs text-slate-600 italic">
          Catatan: "{alert.note}"
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          type="button"
          onClick={() => onViewDetail(alert)}
          className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Lihat Rincian Resep & Opsi B</span>
        </button>

        <div className="flex items-center gap-2">
          {isOpen && (
            <button
              type="button"
              onClick={() => onAcknowledge(alert)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold transition-all cursor-pointer"
            >
              Tandai Ditinjau
            </button>
          )}

          {!isResolved && (
            <button
              type="button"
              onClick={() => onDismiss(alert)}
              className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold transition-all cursor-pointer"
            >
              Abaikan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
