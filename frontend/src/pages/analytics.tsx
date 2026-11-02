import { BarChart3, UtensilsCrossed, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useCapacity } from "@/api/hooks/use-capacity";
import { formatRupiah, formatNumber } from "@/lib/format";

export function AnalyticsPage() {
  const { data: capacityMenus, isLoading, isError } = useCapacity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Analitik Menu & Kapasitas
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Analisis kapasitas porsi, deteksi bahan pembatas (bottleneck), dan evaluasi efisiensi
          resep.
        </p>
      </div>

      {/* Kapasitas & Bottleneck Section (FR-CAP-01, BR-08) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <UtensilsCrossed className="w-4 h-4" />
              </span>
              Kapasitas Porsi & Bahan Pembatas (Bottleneck)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Estimasi sisa porsi yang dapat disajikan berdasarkan ketersediaan bahan baku aktif
              (BR-08).
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Memuat data kapasitas menu...</span>
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-sm text-rose-600 bg-rose-50/60 rounded-xl">
            Gagal memuat data kapasitas. Silakan coba lagi.
          </div>
        ) : !capacityMenus || capacityMenus.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Belum ada menu aktif yang terdaftar.
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
                          <span className="font-medium text-slate-700">Dibatasi bahan:</span>
                          <strong className="text-slate-900">
                            {menu.bottleneck.ingredientName}
                          </strong>
                          <span>
                            (tersedia {formatNumber(menu.bottleneck.validStockBase)}{" "}
                            {menu.bottleneck.baseUnit})
                          </span>
                        </>
                      ) : menu.hasRecipe && menu.bottleneckIngredientName ? (
                        <>
                          <span className="font-medium text-slate-700">Dibatasi bahan:</span>
                          <strong className="text-slate-900">
                            {menu.bottleneckIngredientName}
                          </strong>
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
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold tabular-nums">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Sisa {menu.capacity} porsi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold tabular-nums">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Tersedia {menu.capacity} porsi
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <BarChart3 className="w-10 h-10 text-indigo-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Matriks Menu Engineering</h2>
        <p className="text-sm text-slate-500">
          Visualisasi scatter plot Recharts akan aktif pada Fase 6.
        </p>
      </div>
    </div>
  );
}
export default AnalyticsPage;
