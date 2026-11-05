import { useState } from "react";
import { TrendingUp, Calendar, Layers } from "lucide-react";
import { formatRupiah } from "@/lib/format";

export interface SalesDayTrend {
  date: string;
  dayName: string;
  label: string;
  omzet: string;
  portionCount: number;
  transactionCount: number;
}

export interface DashboardSalesTrendChartProps {
  salesLast7Days?: SalesDayTrend[];
}

export function DashboardSalesTrendChart({ salesLast7Days = [] }: DashboardSalesTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalOmzet = salesLast7Days.reduce((sum, d) => sum + (Number.parseFloat(d.omzet) || 0), 0);
  const totalPortions = salesLast7Days.reduce((sum, d) => sum + d.portionCount, 0);
  const totalTransactions = salesLast7Days.reduce((sum, d) => sum + d.transactionCount, 0);

  const maxOmzet = Math.max(
    ...salesLast7Days.map((d) => Number.parseFloat(d.omzet) || 0),
    1000 // avoid divide by zero
  );

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Tren Penjualan 7 Hari
            </h2>
            <p className="text-xs text-slate-500">
              Total 7 hari:{" "}
              <span className="font-semibold text-emerald-700 tabular-nums">
                {formatRupiah(totalOmzet)}
              </span>{" "}
              ({totalPortions} porsi dari {totalTransactions} struk)
            </p>
          </div>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />7 Hari Terakhir
          </span>
        </div>
      </div>

      {salesLast7Days.length === 0 ? (
        <div className="py-12 text-center space-y-2 flex flex-col items-center justify-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700">Belum Ada Data Penjualan</p>
          <p className="text-xs text-slate-400">
            Data grafik akan muncul setelah ada transaksi kasir.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Responsive Column Bar Chart with explicit height to prevent collapse */}
          <div className="h-44 sm:h-52 w-full pt-6 pb-2 flex items-end justify-between gap-2 sm:gap-6 px-3 sm:px-6 bg-slate-50/60 rounded-xl border border-slate-100">
            {salesLast7Days.map((day, idx) => {
              const numericOmzet = Number.parseFloat(day.omzet) || 0;
              const heightPercent = Math.max(Math.round((numericOmzet / maxOmzet) * 100), 4);
              const isToday = idx === salesLast7Days.length - 1;
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${day.label}: ${formatRupiah(numericOmzet)}, ${day.portionCount} porsi`}
                >
                  {/* Floating tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-12 z-30 px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                      <div className="font-bold">{day.label}</div>
                      <div className="text-emerald-400 font-bold tabular-nums">
                        {formatRupiah(numericOmzet)}
                      </div>
                      <div className="text-slate-300 text-[10px]">
                        {day.portionCount} porsi · {day.transactionCount} transaksi
                      </div>
                    </div>
                  )}

                  {/* Top value label */}
                  <span
                    className={`text-[10px] tabular-nums font-bold mb-1 transition-opacity ${
                      numericOmzet > 0
                        ? isHovered || isToday
                          ? "text-emerald-700 font-extrabold opacity-100"
                          : "text-slate-500 opacity-80"
                        : "text-transparent"
                    }`}
                  >
                    {numericOmzet >= 1000000
                      ? `${(numericOmzet / 1000000).toFixed(1)}jt`
                      : numericOmzet >= 1000
                        ? `${Math.round(numericOmzet / 1000)}rb`
                        : numericOmzet > 0
                          ? numericOmzet
                          : ""}
                  </span>

                  {/* Bar column: full height container with inner percentage height */}
                  <div className="w-full flex-1 flex flex-col justify-end items-center max-w-[52px] sm:max-w-[72px]">
                    <div className="w-full h-full bg-slate-200/60 rounded-t-xl overflow-hidden flex flex-col justify-end p-0.5">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isToday
                            ? "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm"
                            : isHovered
                              ? "bg-emerald-500"
                              : numericOmzet > 0
                                ? "bg-emerald-600/85 hover:bg-emerald-500"
                                : "bg-slate-300/40"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Bottom labels: day name & date */}
                  <div className="mt-2 text-center">
                    <span
                      className={`block text-xs font-bold ${
                        isToday ? "text-emerald-700" : "text-slate-700"
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span className="block text-[10px] text-slate-500 tabular-nums font-medium">
                      {day.label.split(" ")[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Metrics Footer */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-[11px] text-slate-500">Rata-rata Harian</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 tabular-nums">
                {formatRupiah(totalOmzet / 7)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-[11px] text-slate-500">Total Porsi</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-700 tabular-nums">
                {totalPortions} porsi
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-[11px] text-slate-500">Total Struk</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 tabular-nums">
                {totalTransactions} transaksi
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardSalesTrendChart;
