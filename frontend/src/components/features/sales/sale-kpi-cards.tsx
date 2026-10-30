import { Receipt, DollarSign, TrendingUp, Layers } from "lucide-react";
import type { SaleDetail } from "../../../api/hooks/use-sales.js";
import { formatRupiah } from "../../../lib/format.js";

interface SaleKpiCardsProps {
  sales: SaleDetail[];
  totalTransactions: number;
  isOwner?: boolean;
}

export function SaleKpiCards({ sales, totalTransactions, isOwner = false }: SaleKpiCardsProps) {
  // Aggregate statistics across current sales
  let totalRevenue = 0;
  let totalCost = 0;
  let totalOverhead = 0;

  for (const s of sales) {
    totalRevenue += parseFloat(s.totalAmount) || 0;
    if (isOwner) {
      if (s.totalIngredientCost) totalCost += parseFloat(s.totalIngredientCost) || 0;
      if (s.totalOverhead) totalOverhead += parseFloat(s.totalOverhead) || 0;
    }
  }

  const grossProfit = totalRevenue - totalCost - totalOverhead;
  const overallMarginPct =
    totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <div
      className={`grid gap-3 sm:gap-4 ${isOwner ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2"}`}
    >
      {/* 1. Total Transaksi */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-bold uppercase tracking-wider">Total Transaksi</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
          {totalTransactions.toLocaleString("id-ID")}
        </div>
        <p className="text-[11px] text-slate-400">Jumlah nota terbit</p>
      </div>

      {/* 2. Total Omzet */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-bold uppercase tracking-wider">Total Omzet</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
          {formatRupiah(totalRevenue)}
        </div>
        <p className="text-[11px] text-slate-400">Total nilai penjualan</p>
      </div>

      {/* 3. Total HPP Bahan (OWNER only) */}
      {isOwner && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">HPP Bahan Baku</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 tabular-nums">
            {formatRupiah(totalCost)}
          </div>
          <p className="text-[11px] text-slate-400">Modal bahan batch FEFO</p>
        </div>
      )}

      {/* 4. Total Laba Bersih / Margin (OWNER only) */}
      {isOwner && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Laba Kotor</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">
            {formatRupiah(grossProfit)}
          </div>
          <p className="text-[11px] text-slate-400">
            Margin rata-rata: <span className="font-bold text-slate-700">{overallMarginPct}%</span>
          </p>
        </div>
      )}
    </div>
  );
}
