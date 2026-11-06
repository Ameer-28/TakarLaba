import { useMemo } from "react";
import { TrendingUp, Calendar, Layers } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { formatRupiah } from "@/lib/format";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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

const chartConfig = {
  omzet: {
    color: "#059669",
    label: "Omzet Penjualan",
  },
} satisfies ChartConfig;

export function DashboardSalesTrendChart({ salesLast7Days = [] }: DashboardSalesTrendChartProps) {
  const totalOmzet = salesLast7Days.reduce((sum, d) => sum + (Number.parseFloat(d.omzet) || 0), 0);
  const totalPortions = salesLast7Days.reduce((sum, d) => sum + d.portionCount, 0);
  const totalTransactions = salesLast7Days.reduce((sum, d) => sum + d.transactionCount, 0);

  const chartData = useMemo(() => {
    return salesLast7Days.map((d) => ({
      date: d.date,
      dayName: d.dayName,
      label: d.label,
      omzet: Number.parseFloat(d.omzet) || 0,
      portionCount: d.portionCount,
      transactionCount: d.transactionCount,
    }));
  }, [salesLast7Days]);

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
          {/* Recharts Line Chart Container matching shadcn demo pattern */}
          <div className="w-full pt-4 pb-2 px-1 sm:px-3 bg-slate-50/60 rounded-xl border border-slate-100">
            <ChartContainer className="h-52 sm:h-60 w-full aspect-auto" config={chartConfig}>
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                  top: 16,
                  bottom: 6,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-slate-200/60"
                />
                <XAxis
                  dataKey="dayName"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={(val, idx) => {
                    const item = chartData[idx];
                    return item ? `${item.dayName} (${item.label.split(" ")[0]})` : String(val);
                  }}
                  className="text-[11px] font-medium text-slate-500"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_label, payload) => {
                        const first = payload?.[0]?.payload as
                          { dayName?: string; label?: string } | undefined;
                        return first ? `${first.dayName}, ${first.label}` : _label;
                      }}
                      formatter={(value, _name, item) => (
                        <div className="flex flex-col gap-1 w-full min-w-36">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500 text-xs">Omzet:</span>
                            <span className="font-bold text-emerald-600 font-mono tabular-nums text-xs">
                              {formatRupiah(Number(value))}
                            </span>
                          </div>
                          {item.payload && (
                            <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1 flex justify-between gap-2">
                              <span>
                                {String(
                                  (item.payload as Record<string, unknown>).portionCount ?? 0
                                )}{" "}
                                porsi
                              </span>
                              <span>
                                {String(
                                  (item.payload as Record<string, unknown>).transactionCount ?? 0
                                )}{" "}
                                transaksi
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    />
                  }
                />
                <Line
                  dataKey="omzet"
                  name="Omzet"
                  type="natural"
                  stroke="var(--color-omzet)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "var(--color-omzet)",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ChartContainer>
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
