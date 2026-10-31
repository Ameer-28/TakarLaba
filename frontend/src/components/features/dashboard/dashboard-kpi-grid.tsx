import { Link } from "react-router";
import { TrendingUp, Coins, AlertTriangle, Clock, Package } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { DashboardSummaryData } from "@/api/hooks/use-dashboard";

interface DashboardKpiGridProps {
  summary: DashboardSummaryData["summary"];
}

export function DashboardKpiGrid({ summary }: DashboardKpiGridProps) {
  const hasOpenAlerts = summary.openAlertCount > 0;
  const hasExpiringStock = Number(summary.expiringStockValue) > 0;
  const hasLowStock = summary.lowStockCount > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* 1. Omzet Hari Ini */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500">Omzet Hari Ini</span>
          <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>
        <p className="text-2xl font-bold tabular-nums text-slate-900">
          {formatRupiah(summary.omzet)}
        </p>
        <p className="text-xs text-slate-500">
          <strong className="text-slate-700">{summary.transactionCount}</strong> transaksi tercatat
        </p>
      </div>

      {/* 2. Estimasi Laba Hari Ini */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500">Estimasi Laba</span>
          <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <Coins className="w-4 h-4" />
          </span>
        </div>
        <p className="text-2xl font-bold tabular-nums text-slate-900">
          {formatRupiah(summary.estimatedProfit)}
        </p>
        <p className="text-xs text-slate-500">
          Margin:{" "}
          <strong className="text-blue-700 tabular-nums">{summary.averageMarginPercent}%</strong>{" "}
          (Target: {summary.targetMargin}%)
        </p>
      </div>

      {/* 3. Peringatan Margin */}
      <Link
        to="/alerts"
        className={`p-5 rounded-2xl border shadow-xs space-y-1 transition hover:shadow-sm ${
          hasOpenAlerts
            ? "bg-amber-50/40 border-amber-200 hover:border-amber-300"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500">Peringatan Margin</span>
          <span
            className={`p-2 rounded-lg ${
              hasOpenAlerts ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>
        <p
          className={`text-2xl font-bold tabular-nums ${
            hasOpenAlerts ? "text-amber-700" : "text-emerald-700"
          }`}
        >
          {summary.openAlertCount} Menu
        </p>
        <p className="text-xs text-slate-500">
          {hasOpenAlerts ? "Margin di bawah target, klik untuk tinjau" : "Semua margin menu aman"}
        </p>
      </Link>

      {/* 4. Nilai Stok Kedaluwarsa */}
      <div
        className={`p-5 rounded-2xl border shadow-xs space-y-1 ${
          hasExpiringStock ? "bg-rose-50/30 border-rose-200" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500">Stok Berisiko</span>
          <span
            className={`p-2 rounded-lg ${
              hasExpiringStock ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            <Clock className="w-4 h-4" />
          </span>
        </div>
        <p
          className={`text-2xl font-bold tabular-nums ${
            hasExpiringStock ? "text-rose-700" : "text-slate-900"
          }`}
        >
          {formatRupiah(summary.expiringStockValue)}
        </p>
        <p className="text-xs text-slate-500">
          Kedaluwarsa ≤ {summary.expiryWarnDays} hari ke depan
        </p>
      </div>

      {/* 5. Stok Menipis */}
      <div
        className={`p-5 rounded-2xl border shadow-xs space-y-1 ${
          hasLowStock ? "bg-orange-50/30 border-orange-200" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500">Stok Menipis</span>
          <span
            className={`p-2 rounded-lg ${
              hasLowStock ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            <Package className="w-4 h-4" />
          </span>
        </div>
        <p
          className={`text-2xl font-bold tabular-nums ${
            hasLowStock ? "text-orange-700" : "text-slate-900"
          }`}
        >
          {summary.lowStockCount} Bahan
        </p>
        <p className="text-xs text-slate-500">
          {hasLowStock ? "Di bawah batas minimum stok" : "Semua bahan stok aman"}
        </p>
      </div>
    </div>
  );
}
