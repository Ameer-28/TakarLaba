import { Eye, Clock, Layers, TrendingUp } from "lucide-react";
import type { SaleDetail } from "../../../api/hooks/use-sales.js";
import { formatRupiah, formatDate, formatTime } from "../../../lib/format.js";

interface SaleTableProps {
  sales: SaleDetail[];
  isOwner?: boolean;
  onSelectSale: (sale: SaleDetail) => void;
}

const paymentLabels: Record<string, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  TRANSFER: "Transfer",
};

const paymentBadgeColors: Record<string, string> = {
  CASH: "bg-emerald-50 text-emerald-700 border-emerald-200",
  QRIS: "bg-blue-50 text-blue-700 border-blue-200",
  TRANSFER: "bg-purple-50 text-purple-700 border-purple-200",
};

export function SaleTable({ sales, isOwner = false, onSelectSale }: SaleTableProps) {
  return (
    <>
      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">No. Struk & Waktu</th>
                <th className="py-3.5 px-4">Kasir</th>
                <th className="py-3.5 px-4">Menu Dipesan</th>
                <th className="py-3.5 px-4">Bayar</th>
                <th className="py-3.5 px-4 text-right">Total Omzet</th>
                {isOwner && <th className="py-3.5 px-4 text-right">HPP & Margin</th>}
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => {
                const formattedDate = formatDate(sale.soldAt);
                const formattedTime = formatTime(sale.soldAt);

                const menuSummary = sale.items
                  .map((item) => `${item.menuNameSnapshot} (${item.qty})`)
                  .join(", ");

                return (
                  <tr
                    key={sale.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectSale(sale)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">{sale.invoiceNo}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formattedDate}, {formattedTime} WIB
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">
                        {sale.cashier?.name ?? "Kasir"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-800 font-medium truncate" title={menuSummary}>
                        {menuSummary}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {sale.items.reduce((acc, i) => acc + i.qty, 0)} item total
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block font-bold px-2 py-0.5 rounded-md border text-[11px] ${
                          paymentBadgeColors[sale.paymentMethod] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-extrabold text-slate-900 text-sm tabular-nums">
                        {formatRupiah(sale.totalAmount)}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="py-3.5 px-4 text-right">
                        {sale.grossMargin && sale.marginPercentage ? (
                          <div>
                            <span className="font-bold text-emerald-600 text-xs tabular-nums block">
                              {formatRupiah(sale.grossMargin)}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                              Margin {sale.marginPercentage}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSale(sale);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View (< md) */}
      <div className="md:hidden space-y-3">
        {sales.map((sale) => {
          const formattedDate = formatDate(sale.soldAt);
          const formattedTime = formatTime(sale.soldAt);

          return (
            <div
              key={sale.id}
              onClick={() => onSelectSale(sale)}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 hover:border-slate-300 transition-all cursor-pointer"
            >
              {/* Top line: Invoice & Payment */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">{sale.invoiceNo}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formattedDate}, {formattedTime} WIB • {sale.cashier?.name ?? "Kasir"}
                  </div>
                </div>
                <span
                  className={`inline-block font-bold px-2 py-0.5 rounded-md border text-[11px] ${
                    paymentBadgeColors[sale.paymentMethod] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}
                </span>
              </div>

              {/* Menu items summary */}
              <div className="text-xs text-slate-600 line-clamp-2">
                {sale.items.map((item) => `${item.menuNameSnapshot} (${item.qty})`).join(", ")}
              </div>

              {/* Bottom Line: Total & Detail Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Transaksi</span>
                  <span className="font-extrabold text-slate-900 text-sm tabular-nums">
                    {formatRupiah(sale.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner && sale.marginPercentage && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <TrendingUp className="w-3 h-3" />
                      {sale.marginPercentage}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSale(sale);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Alokasi</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
