import { Link } from "react-router";
import { UtensilsCrossed, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { formatRupiah, formatNumber } from "@/lib/format";
import type { DashboardSummaryData } from "@/api/hooks/use-dashboard";

interface DashboardLowestCapacityProps {
  menus: DashboardSummaryData["lowestCapacityMenus"];
}

export function DashboardLowestCapacity({ menus }: DashboardLowestCapacityProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <UtensilsCrossed className="w-4 h-4" />
            </span>
            Kapasitas Porsi Menu Terendah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estimasi porsi tersisa berdasarkan ketersediaan bahan baku (BR-08)
          </p>
        </div>
        <Link
          to="/menus"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 transition"
        >
          Kelola Menu
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {menus.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800">Belum Ada Menu Aktif</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Buat menu dan atur resep bahan baku untuk melihat estimasi kapasitas porsi.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {menus.map((item) => {
            const isOutOfStock = item.capacity === 0;
            const isLowPortions = item.capacity > 0 && item.capacity <= 10;

            return (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{item.name}</span>
                    {item.category && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        {item.category}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 tabular-nums">
                      {formatRupiah(item.sellingPrice)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    {item.hasRecipe && item.bottleneckIngredient ? (
                      <>
                        <span className="font-medium text-slate-700">Dibatasi bahan:</span>
                        <strong className="text-slate-900">{item.bottleneckIngredient.name}</strong>
                        <span>
                          (sisa {formatNumber(item.bottleneckIngredient.remainingStock)}{" "}
                          {item.bottleneckIngredient.unit})
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 italic">Belum ada resep bahan baku</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Habis (0 porsi)
                    </span>
                  ) : isLowPortions ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold tabular-nums">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Sisa {item.capacity} porsi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold tabular-nums">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Tersedia {item.capacity} porsi
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
