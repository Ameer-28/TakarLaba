import { useState } from "react";
import {
  BarChart3,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Info,
} from "lucide-react";
import { useCapacity } from "@/api/hooks/use-capacity";
import { useMenuEngineering } from "@/api/hooks/use-menu-engineering";
import { MenuEngineeringQuadrantChart } from "@/components/features/analytics/menu-engineering-quadrant-chart";
import { MenuEngineeringTable } from "@/components/features/analytics/menu-engineering-table";
import { MenuEngineeringRecommendations } from "@/components/features/analytics/menu-engineering-recommendations";
import { formatRupiah, formatNumber } from "@/lib/format";

export function AnalyticsPage() {
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);

  const {
    data: capacityMenus,
    isLoading: isCapacityLoading,
    isError: isCapacityError,
  } = useCapacity();

  const {
    data: megData,
    isLoading: isMegLoading,
    isError: isMegError,
  } = useMenuEngineering(selectedDays);

  const periodOptions = [
    { label: "Last 7 Days", value: 7 },
    { label: "Last 30 Days", value: 30 },
    { label: "Last 90 Days", value: 90 },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Menu & Capacity Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Evaluate menu portfolio performance, profit quadrant matrix, and bottleneck ingredient
            capacity.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-center">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setSelectedDays(opt.value);
                setSelectedMenuId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDays === opt.value
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Engineering Matrix Section (BR-10, FR-MEG-01) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <BarChart3 className="w-4 h-4" />
              </span>
              Kasavana & Smith Menu Engineering Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              4-quadrant classification based on portion sales volume vs calculated contribution
              margin (BR-10).
            </p>
          </div>

          {megData && megData.isDataSufficient && (
            <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums self-start sm:self-center">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                {formatNumber(megData.totalTransactions)} transactions
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                {formatNumber(megData.totalClassifiedPortions)} portions
              </span>
            </div>
          )}
        </div>

        {isMegLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Analyzing menu sales matrix...</span>
          </div>
        ) : isMegError ? (
          <div className="py-10 text-center text-sm text-rose-600 bg-rose-50/60 rounded-xl border border-rose-100">
            Failed to load Menu Engineering analysis. Ensure you are signed in as OWNER.
          </div>
        ) : !megData ? null : (
          <div className="space-y-6">
            {/* Data Sufficiency Warning Banner */}
            {!megData.isDataSufficient && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-amber-950">
                    Insufficient Sales Data for Quadrant Analysis
                  </div>
                  <p className="text-amber-800">
                    {megData.insufficientReason ??
                      "Menu Engineering analysis requires at least 4 active menu items with complete recipes and at least 30 completed transactions in this period."}
                  </p>
                </div>
              </div>
            )}

            {/* Scatter Plot Matrix Chart */}
            <MenuEngineeringQuadrantChart
              classifiedMenus={megData.classifiedMenus}
              popularityThresholdPortions={parseFloat(megData.popularityThresholdPortions)}
              weightedMarginThreshold={parseFloat(megData.weightedMarginThreshold)}
              selectedMenuId={selectedMenuId}
              onSelectMenu={setSelectedMenuId}
            />

            {/* Dynamic Calculated Recommendations */}
            <MenuEngineeringRecommendations
              classifiedMenus={megData.classifiedMenus}
              selectedMenuId={selectedMenuId}
              onSelectMenu={setSelectedMenuId}
            />

            {/* Padanan Accessible Data Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Menu Portfolio Breakdown Table (
                  {megData.classifiedMenus.length + megData.unclassifiedMenus.length} Menu
                  {megData.classifiedMenus.length + megData.unclassifiedMenus.length === 1
                    ? ""
                    : "s"}
                  )
                </h3>
                <span className="text-xs text-slate-400">
                  Click rows to highlight on the matrix chart
                </span>
              </div>
              <MenuEngineeringTable
                classifiedMenus={megData.classifiedMenus}
                unclassifiedMenus={megData.unclassifiedMenus}
                selectedMenuId={selectedMenuId}
                onSelectMenu={setSelectedMenuId}
              />
            </div>
          </div>
        )}
      </div>

      {/* Kapasitas & Bottleneck Section (FR-CAP-01, BR-08) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <UtensilsCrossed className="w-4 h-4" />
              </span>
              Portion Capacity & Bottleneck Ingredients
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Estimated remaining portions that can be prepared based on active stock availability
              (BR-08).
            </p>
          </div>
        </div>

        {isCapacityLoading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading menu capacity data...</span>
          </div>
        ) : isCapacityError ? (
          <div className="py-8 text-center text-sm text-rose-600 bg-rose-50/60 rounded-xl">
            Failed to load capacity data. Please try again.
          </div>
        ) : !capacityMenus || capacityMenus.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No active menu items registered yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {capacityMenus.map((menu) => {
              const isOutOfStock = menu.capacity === 0;
              const isLow = menu.capacity > 0 && menu.capacity <= 10;

              return (
                <div
                  key={menu.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{menu.name}</span>
                      {menu.category && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {menu.category}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 tabular-nums">
                        {formatRupiah(menu.sellingPrice)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      {menu.hasRecipe && menu.bottleneck ? (
                        <>
                          <span className="font-medium text-slate-700">Limited by ingredient:</span>
                          <strong className="text-slate-900">
                            {menu.bottleneck.ingredientName}
                          </strong>
                          <span>
                            ({formatNumber(menu.bottleneck.validStockBase)}{" "}
                            {menu.bottleneck.baseUnit} available)
                          </span>
                        </>
                      ) : menu.hasRecipe && menu.bottleneckIngredientName ? (
                        <>
                          <span className="font-medium text-slate-700">Limited by ingredient:</span>
                          <strong className="text-slate-900">
                            {menu.bottleneckIngredientName}
                          </strong>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">No recipe configured yet</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Sold out (0 portions)
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold tabular-nums">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {menu.capacity} portions left
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold tabular-nums">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {menu.capacity} portions available
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;
