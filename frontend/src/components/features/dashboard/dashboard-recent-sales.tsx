import { Link } from "react-router";
import { ShoppingCart, ArrowRight, Store } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/format";
import type { DashboardSummaryData } from "@/api/hooks/use-dashboard";

interface DashboardRecentSalesProps {
  sales: DashboardSummaryData["recentSales"];
}

export function DashboardRecentSales({ sales }: DashboardRecentSalesProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </span>
            Penjualan Terakhir Hari Ini
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            5 transaksi kasir terkini yang tercatat secara atomik (FEFO)
          </p>
        </div>
        <Link
          to="/sales"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
        >
          Riwayat Penjualan
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {sales.length === 0 ? (
        <div className="py-8 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">Belum Ada Transaksi Hari Ini</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Transaksi penjualan yang dicatat di POS akan langsung memotong stok batch secara FEFO.
          </p>
          <Link
            to="/pos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition shadow-xs"
          >
            <Store className="w-3.5 h-3.5" />
            Buka Kasir POS
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    {sale.invoiceNo}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    {sale.paymentMethod}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {formatDate(sale.soldAt, true)} • Dilayani oleh{" "}
                  <strong className="text-slate-700">{sale.cashierName}</strong> ({sale.itemCount}{" "}
                  item)
                </p>
              </div>

              <div className="text-right self-end sm:self-center">
                <span className="text-sm font-bold text-slate-900 tabular-nums">
                  {formatRupiah(sale.totalAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
