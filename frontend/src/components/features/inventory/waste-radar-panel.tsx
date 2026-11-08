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
import { CustomSelect } from "@/components/ui/custom-select";

export function WasteRadarPanel() {
  const [warnDays, setWarnDays] = useState<number>(7);
  const { data, isLoading, isError, refetch } = useWasteRadar(warnDays);

  const dayOptions = [
    { label: "3 Days", value: 3 },
    { label: "7 Days (Default)", value: 7 },
    { label: "14 Days", value: 14 },
    { label: "30 Days", value: 30 },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Scanning expiry risk radar...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-rose-900">Failed to load Waste Radar data</p>
        <button
          onClick={() => void refetch()}
          className="px-4 py-2 bg-white border border-rose-300 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-100 transition-colors"
        >
          Try Again
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
              Waste Radar — Turn Risk into Revenue
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track batches approaching expiration, identify affected menu items, and apply safe promo
            discount floors to prevent waste losses.
          </p>
        </div>

        {/* Tablet & Mobile Day Range Dropdown (tampilan tablet kebawah) */}
        <div className="lg:hidden w-full sm:w-auto min-w-[190px]">
          <CustomSelect<number>
            value={warnDays}
            onChange={setWarnDays}
            options={dayOptions.map((opt) => ({
              value: opt.value,
              label: `Range: ${opt.label}`,
            }))}
            triggerClassName="py-1.5 px-3 text-xs bg-slate-50"
          />
        </div>

        {/* Desktop Day Range Filter */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-center">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <span className="text-xs font-medium text-slate-500 pr-1">Range:</span>
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
              Total Ingredient Risk Value
            </span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums text-rose-600">
              {formatRupiah(summary.totalRiskValue)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Potential loss if batches are not utilized before expiration.
          </p>
        </div>

        {/* Expiring Batches Count */}
        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Batches Needing Attention
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums text-amber-600">
              {formatNumber(summary.totalExpiringBatches)}
            </span>
            <span className="text-xs text-slate-500">batches</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Within the next {summary.warnDays} days (or already past).
          </p>
        </div>

        {/* Impacted Menus */}
        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Promo Opportunity Menus
            </span>
            <Utensils className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums text-emerald-600">
              {formatNumber(summary.totalImpactedMenus)}
            </span>
            <span className="text-xs text-slate-500">recipes</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Can be promoted with min. profit margin of {summary.wastePromoMinMarginPercent}%.
          </p>
        </div>
      </div>

      {/* Main Batch List */}
      {items.length === 0 ? (
        <div className="p-10 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-emerald-950">All Ingredient Stock in Control!</h3>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            No ingredient batches approaching expiration within the next {warnDays} days.
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
                ? `Expired (${Math.abs(item.daysUntilExpiry)} days ago)`
                : item.daysUntilExpiry === 0
                  ? "Expires Today"
                  : `${item.daysUntilExpiry} days remaining`}
            </span>
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              {item.ingredientName}
            </h3>
            {item.category && (
              <span className="text-[11px] font-medium text-slate-500">
                Category: {item.category}
              </span>
            )}
          </div>
        </div>

        {/* Quantities & Risk Rp */}
        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-slate-500 block text-[11px]">Remaining Batch Stock:</span>
            <span className="font-bold tabular-nums text-slate-800">
              {item.remainingQty} {item.unit}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[11px]">Risk Value:</span>
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
          <span>Linked Menus & Safe Promo Discount Recommendations (Zero Loss)</span>
        </h4>

        {item.relatedMenus.length === 0 ? (
          <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
            No active recipes use this ingredient yet. Create a recipe or use it in a new dish to
            utilize this stock.
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
                      Normal Margin: {menu.currentMarginPercent}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Regular Price:</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {formatRupiah(menu.sellingPrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Full Cost (HPP):</span>
                      <span className="font-bold tabular-nums text-slate-700">
                        {formatRupiah(menu.hppPenuh)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Safe Promotion Box */}
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-900">
                    <span className="font-semibold text-[11px]">Promo Floor Price:</span>
                    <span className="font-black tabular-nums text-emerald-700 text-xs">
                      {formatRupiah(menu.promoFloorPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-800">
                    <span className="text-[11px]">Safe Discount Ceiling:</span>
                    <span className="font-extrabold tabular-nums text-emerald-800">
                      Max. {formatRupiah(menu.maxDiscountAmount)} ({menu.maxDiscountPercent}%)
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700/90 leading-tight pt-1 border-t border-emerald-200/60">
                    Safe to discount up to the limit above while maintaining a minimum profit margin
                    of {menu.promoMarginPercent}% to recover cost and utilize stock.
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
