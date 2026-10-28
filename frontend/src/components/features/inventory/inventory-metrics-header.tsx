import { Clock, AlertTriangle, AlertCircle } from "lucide-react";

interface InventoryMetricsHeaderProps {
  total: number;
  soonCount: number;
  expiredCount: number;
  lowStockCount: number;
}

export function InventoryMetricsHeader({
  total,
  soonCount,
  expiredCount,
  lowStockCount,
}: InventoryMetricsHeaderProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <span className="text-xs text-slate-500 font-medium block">Total Master Bahan</span>
        <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{total}</span>
      </div>

      <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-amber-700 font-semibold block">Segera Kedaluwarsa</span>
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <span className="text-2xl font-extrabold text-amber-700 tabular-nums">{soonCount}</span>
        <span className="text-[11px] text-slate-400 block mt-0.5">dalam 3 hari ke depan</span>
      </div>

      <div className="bg-white rounded-2xl border border-rose-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-rose-700 font-semibold block">Bahan Kedaluwarsa</span>
          <AlertTriangle className="w-4 h-4 text-rose-600" />
        </div>
        <span className="text-2xl font-extrabold text-rose-700 tabular-nums">{expiredCount}</span>
        <span className="text-[11px] text-slate-400 block mt-0.5">harus segera dipisahkan</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600 font-semibold block">Stok Menipis</span>
          <AlertCircle className="w-4 h-4 text-slate-500" />
        </div>
        <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{lowStockCount}</span>
        <span className="text-[11px] text-slate-400 block mt-0.5">di bawah batas aman</span>
      </div>
    </div>
  );
}
