import { useState } from "react";
import {
  AlertTriangle,
  Tag,
  Clock,
  Utensils,
  CheckCircle,
  Loader2,
  Calendar,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import { useWasteRadar, type WasteRadarItem } from "@/api/hooks/use-waste-radar";
import { formatRupiah, formatNumber } from "@/lib/format";

export function WasteRadarPanel() {
  const [warnDays, setWarnDays] = useState<number>(7);
  const { data, isLoading, isError, refetch } = useWasteRadar(warnDays);

  const dayOptions = [
    { label: "3 Hari", value: 3 },
    { label: "7 Hari (Bawaan)", value: 7 },
    { label: "14 Hari", value: 14 },
    { label: "30 Hari", value: 30 },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Memindai radar risiko kedaluwarsa...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-rose-900">Gagal memuat data Waste Radar</p>
        <button
          onClick={() => void refetch()}
          className="px-4 py-2 bg-white border border-rose-300 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-100 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { summary, items } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Waste Radar — Ubah Risiko Menjadi Pendapatan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau batch mendekati kedaluwarsa, identifikasi menu terkait, dan terapkan batas diskon
            promo yang aman agar tidak merugi.
          </p>
        </div>

        {/* Day Range Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-center">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <span className="text-xs font-medium text-slate-500 pr-1">Rentang:</span>
          {dayOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setWarnDays(opt.value)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                warnDays === opt.value
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Risk Card */}
        <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Total Nilai Risiko Bahan
            </span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums text-rose-600">
              {formatRupiah(summary.totalRiskValue)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Potensi kerugian jika batch tidak termanfaatkan sebelum kedaluwarsa.
          </p>
        </div>

        {/* Expiring Batches Count */}
        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Batch Perlu Perhatian
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums text-amber-600">
              {formatNumber(summary.totalExpiringBatches)}
            </span>
            <span className="text-xs text-slate-500">batch</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dalam rentang {summary.warnDays} hari ke depan (atau sudah lewat).
          </p>
        </div>

        {/* Impacted Menus */}
        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Menu Potensial Promo
            </span>
            <Utensils className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums text-emerald-600">
              {formatNumber(summary.totalImpactedMenus)}
            </span>
            <span className="text-xs text-slate-500">resep menu</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dapat dipromosikan dengan batas laba min. {summary.wastePromoMinMarginPercent}%.
          </p>
        </div>
      </div>

      {/* Main Batch List */}
      {items.length === 0 ? (
        <div className="p-10 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-emerald-950">Semua Stok Bahan Terkendali!</h3>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            Tidak ditemukan batch bahan baku yang mendekati batas kedaluwarsa dalam rentang waktu{" "}
            {warnDays} hari ke depan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <WasteRadarBatchCard key={item.batchId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function WasteRadarBatchCard({ item }: { item: WasteRadarItem }) {
  const isExpired = item.status === "EXPIRED";

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isExpired
          ? "bg-rose-50/40 border-rose-200"
          : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
      }`}
    >
      {/* Batch Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isExpired
                ? "bg-rose-600 text-white"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isExpired
                ? `Kedaluwarsa (${Math.abs(item.daysUntilExpiry)} hari lalu)`
                : item.daysUntilExpiry === 0
                  ? "Kedaluwarsa Hari Ini"
                  : `Sisa ${item.daysUntilExpiry} hari`}
            </span>
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              {item.ingredientName}
            </h3>
            {item.category && (
              <span className="text-[11px] font-medium text-slate-500">
                Kategori: {item.category}
              </span>
            )}
          </div>
        </div>

        {/* Quantities & Risk Rp */}
        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-slate-500 block text-[11px]">Sisa Stok Batch:</span>
            <span className="font-bold tabular-nums text-slate-800">
              {item.remainingQty} {item.unit}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[11px]">Nilai Risiko:</span>
            <span
              className={`font-black tabular-nums ${isExpired ? "text-rose-600" : "text-amber-700"}`}
            >
              {formatRupiah(item.riskValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Linked Menus & Promo Discount Suggestions */}
      <div className="mt-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
          <Tag className="w-3.5 h-3.5 text-emerald-600" />
          <span>Menu Terkait & Rekomendasi Diskon Promo Aman (Anti-Rugi)</span>
        </h4>

        {item.relatedMenus.length === 0 ? (
          <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
            Belum ada resep menu aktif yang menggunakan bahan ini. Buat resep atau gunakan pada menu
            baru agar bahan dapat terjual.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {item.relatedMenus.map((menu) => (
              <div
                key={menu.menuId}
                className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm">{menu.menuName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium text-[10px]">
                      Margin Normal: {menu.currentMarginPercent}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Harga Normal:</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {formatRupiah(menu.sellingPrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">HPP Penuh:</span>
                      <span className="font-bold tabular-nums text-slate-700">
                        {formatRupiah(menu.hppPenuh)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Safe Promotion Box */}
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-900">
                    <span className="font-semibold text-[11px]">Harga Lantai Promo:</span>
                    <span className="font-black tabular-nums text-emerald-700 text-xs">
                      {formatRupiah(menu.promoFloorPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-800">
                    <span className="text-[11px]">Batas Diskon Aman:</span>
                    <span className="font-extrabold tabular-nums text-emerald-800">
                      Maks. {formatRupiah(menu.maxDiscountAmount)} ({menu.maxDiscountPercent}%)
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700/90 leading-tight pt-1 border-t border-emerald-200/60">
                    Aman didiskon hingga batas di atas dengan laba minimal {menu.promoMarginPercent}
                    % agar modal tertutup dan bahan terhabiskan.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
