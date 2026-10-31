import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import type { PreviewCostResponse, MenuItem } from "../../../api/hooks/use-menus.js";
import { formatRupiah, formatPercent } from "../../../lib/format.js";

interface RecipeCostPreviewPanelProps {
  previewData: PreviewCostResponse | null;
  isPreviewLoading: boolean;
  menu: MenuItem;
}

export function RecipeCostPreviewPanel({
  previewData,
  isPreviewLoading,
  menu,
}: RecipeCostPreviewPanelProps) {
  return (
    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
            Live Costing Preview
          </span>
        </div>
        {isPreviewLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
      </div>

      {/* Status Badge */}
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
          Status Margin Penjualan
        </span>
        {previewData?.marginStatus === "AMAN" && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aman (Target Tercapai)
          </div>
        )}
        {previewData?.marginStatus === "WASPADA" && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Waspada (Mendekati Batas)
          </div>
        )}
        {previewData?.marginStatus === "BAHAYA" && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            Bahaya (Di Bawah Target)
          </div>
        )}
        {(!previewData || previewData.marginStatus === "INCOMPLETE") && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            Harga Bahan Belum Lengkap
          </div>
        )}
      </div>

      {/* Breakdown Metric Rows */}
      <div className="space-y-2.5 text-xs pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between text-slate-300">
          <span>HPP Bahan Baku</span>
          <span className="font-bold text-white tabular-nums">
            {previewData?.hppBahan ? formatRupiah(previewData.hppBahan) : "Belum lengkap"}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1">
            Beban Overhead/porsi
            <span className="text-[10px] text-slate-500">(alokasi)</span>
          </span>
          <span className="font-bold text-white tabular-nums">
            {previewData ? formatRupiah(previewData.overheadPerPortion) : "Rp0"}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-200 pt-1 border-t border-slate-800/80 font-bold">
          <span>Total HPP Penuh</span>
          <span className="text-sm font-black text-emerald-400 tabular-nums">
            {previewData?.hppPenuh ? formatRupiah(previewData.hppPenuh) : "Belum lengkap"}
          </span>
        </div>
      </div>

      {/* Margin Comparison */}
      <div className="p-3 bg-slate-800/80 rounded-xl space-y-2 border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Harga Jual Menu</span>
          <span className="font-bold text-white tabular-nums">
            {formatRupiah(menu.sellingPrice)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Margin Kontribusi (Rp)</span>
          <span className="font-bold text-emerald-400 tabular-nums">
            {previewData?.marginKontribusi ? formatRupiah(previewData.marginKontribusi) : "-"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Margin Penuh (%)</span>
          <span className="font-black text-white tabular-nums">
            {previewData?.marginPercent ? formatPercent(previewData.marginPercent) : "-"}
          </span>
        </div>
      </div>

      {!previewData?.isCostComplete && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Harga Beli Belum Tercatat
          </p>
          <p className="text-amber-300/80 leading-relaxed">
            Satu atau lebih bahan belum pernah dibeli dalam nota belanja. HPP final akan terhitung
            otomatis begitu ada pembelian bahan tersebut.
          </p>
        </div>
      )}
    </div>
  );
}
