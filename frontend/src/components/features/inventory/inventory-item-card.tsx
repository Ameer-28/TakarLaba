import { Clock, AlertCircle, Layers } from "lucide-react";
import type { IngredientStockSummary } from "@/api/hooks/use-inventory";
import { formatNumber, formatRupiah, formatDate } from "@/lib/format";
import { STATUS_BADGES } from "./types";

interface InventoryItemCardProps {
  item: IngredientStockSummary;
  isOwner: boolean;
  onSelectIngredient: (item: IngredientStockSummary) => void;
}

export function InventoryItemCard({ item, isOwner, onSelectIngredient }: InventoryItemCardProps) {
  const statusMeta = STATUS_BADGES[item.status];
  const StatusIcon = statusMeta.icon;
  const validStockNum = Number(item.validStockBase);
  const expiredStockNum = Number(item.expiredStockBase);
  const minStockNum = Number(item.minStockBase);

  return (
    <div className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-900 text-base">{item.name}</span>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusMeta.label}</span>
          </span>

          {item.isLowStock && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>Stok Rendah</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>
            Satuan:{" "}
            <span className="font-semibold text-slate-700 uppercase font-mono">
              {item.baseUnit}
            </span>
          </span>

          <span>
            Batas Aman:{" "}
            <span className="font-mono text-slate-700">
              {formatNumber(minStockNum)} {item.baseUnit.toLowerCase()}
            </span>
          </span>

          {item.nearestExpiryDate && (
            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Exp Terdekat: {formatDate(item.nearestExpiryDate)}</span>
            </span>
          )}

          {isOwner && item.averageCostPerBase && (
            <span className="text-emerald-700 font-semibold font-mono">
              Rata-rata: {formatRupiah(Number(item.averageCostPerBase), true)} /{" "}
              {item.baseUnit.toLowerCase()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
        <div className="text-left md:text-right">
          <span className="text-[11px] text-slate-400 block font-medium">Stok Valid</span>
          <span
            className={`text-lg font-extrabold tabular-nums block ${
              item.isLowStock ? "text-rose-600" : "text-slate-900"
            }`}
          >
            {formatNumber(validStockNum)} {item.baseUnit.toLowerCase()}
          </span>

          {expiredStockNum > 0 && (
            <span className="text-[11px] text-rose-600 font-bold block tabular-nums">
              + {formatNumber(expiredStockNum)} kedaluwarsa
            </span>
          )}
        </div>

        <button
          onClick={() => onSelectIngredient(item)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Batch FEFO ({item.activeBatchCount})</span>
        </button>
      </div>
    </div>
  );
}
