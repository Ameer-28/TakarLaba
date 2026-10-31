import { formatRupiah } from "../../../lib/format.js";
import type { SaleDetail } from "../../../api/hooks/use-sales.js";

interface SaleFinancialSummaryProps {
  sale: SaleDetail;
  isOwner?: boolean;
}

export function SaleFinancialSummary({ sale, isOwner = false }: SaleFinancialSummaryProps) {
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Total Omzet Penjualan</span>
        <span className="text-white text-base font-extrabold tabular-nums">
          {formatRupiah(sale.totalAmount)}
        </span>
      </div>

      {isOwner && sale.totalIngredientCost && sale.totalOverhead && (
        <>
          <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Total HPP Bahan Baku</span>
              <span className="font-semibold tabular-nums text-slate-200">
                {formatRupiah(sale.totalIngredientCost)}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Total Alokasi Beban Overhead</span>
              <span className="font-semibold tabular-nums text-slate-200">
                {formatRupiah(sale.totalOverhead)}
              </span>
            </div>
          </div>

          {sale.grossMargin && sale.marginPercentage && (
            <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-emerald-400 block">
                  Laba Kotor / Margin
                </span>
                <span className="text-[11px] text-slate-400">
                  Persentase Margin: {sale.marginPercentage}%
                </span>
              </div>
              <span className="text-lg font-black text-emerald-400 tabular-nums">
                {formatRupiah(sale.grossMargin)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
