import { Layers, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import type { SaleDetail } from "../../../api/hooks/use-sales.js";
import { formatRupiah, formatQuantity, formatDate, formatNumber } from "../../../lib/format.js";

type SaleItem = SaleDetail["items"][number];

interface SaleItemCardProps {
  item: SaleItem;
  isOwner?: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function SaleItemCard({
  item,
  isOwner = false,
  isExpanded,
  onToggleExpand,
}: SaleItemCardProps) {
  const hasBatchAllocations = item.batchAllocations && item.batchAllocations.length > 0;
  const unitPriceNum = parseFloat(item.unitPrice);
  const subtotalNum = item.qty * unitPriceNum;

  return (
    <div className="border border-slate-200/80 rounded-2xl p-4 bg-white hover:border-slate-300 transition-colors space-y-3">
      {/* Item Top Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h5 className="font-bold text-slate-900 text-sm">{item.menuNameSnapshot}</h5>
          <div className="text-xs text-slate-500 tabular-nums">
            {item.qty} porsi × {formatRupiah(unitPriceNum)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-extrabold text-slate-900 text-sm tabular-nums">
            {formatRupiah(subtotalNum)}
          </div>
          {isOwner && item.grossMargin && item.marginPercentage && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 justify-end mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>
                Margin {item.marginPercentage}% ({formatRupiah(item.grossMargin)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Item Cost Breakdown (OWNER only) */}
      {isOwner && item.ingredientCostActual && item.overheadAllocated && (
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">HPP Bahan</span>
            <span className="font-bold text-slate-700 tabular-nums">
              {formatRupiah(item.ingredientCostActual)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Beban Overhead</span>
            <span className="font-bold text-slate-700 tabular-nums">
              {formatRupiah(item.overheadAllocated)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Laba Bersih</span>
            <span className="font-bold text-emerald-600 tabular-nums">
              {formatRupiah(item.grossMargin)}
            </span>
          </div>
        </div>
      )}

      {/* FEFO Batch Allocation Breakdown */}
      {hasBatchAllocations && (
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onToggleExpand}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Alokasi Batch Bahan (FEFO) ({item.batchAllocations?.length} batch)
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-2 space-y-1.5">
              {item.batchAllocations?.map((alloc) => {
                const expiryFormatted = alloc.batchExpiryDate
                  ? formatDate(alloc.batchExpiryDate)
                  : "Tanpa Kedaluwarsa";

                return (
                  <div
                    key={alloc.movementId}
                    className="p-2.5 bg-amber-50/40 border border-amber-200/50 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{alloc.ingredientName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-800 font-semibold">
                          Exp: {expiryFormatted}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Batch #{alloc.batchId?.slice(-6) ?? "N/A"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 block sm:hidden">
                          Pemotongan
                        </span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          {formatQuantity(alloc.qtyDeducted, alloc.baseUnit)}
                        </span>
                      </div>

                      {/* Cost per base & subtotal (OWNER only) */}
                      {isOwner && alloc.costPerBase && alloc.subtotalCost && (
                        <div className="border-l border-amber-200/60 pl-3">
                          <span className="text-[10px] text-slate-500 block tabular-nums">
                            @ Rp{formatNumber(alloc.costPerBase, 4)}/{alloc.baseUnit}
                          </span>
                          <span className="font-bold text-amber-900 tabular-nums">
                            {formatRupiah(alloc.subtotalCost)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
