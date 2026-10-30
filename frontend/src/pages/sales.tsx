import { useState } from "react";
import {
  Receipt,
  RefreshCw,
  Eye,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useSalesList, type SaleDetail, type PaymentMethod } from "../api/hooks/use-sales.js";
import { useSession } from "../lib/auth-client.js";
import { formatRupiah } from "../lib/format.js";
import { SaleKpiCards } from "../components/features/sales/sale-kpi-cards.js";
import { SaleFiltersBar } from "../components/features/sales/sale-filters-bar.js";
import { SaleDetailModal } from "../components/features/sales/sale-detail-modal.js";

export function SalesPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  // Filter and search state
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Selected sale for detail modal
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);

  const queryFilters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    paymentMethod: paymentMethod === "ALL" ? undefined : paymentMethod,
    page,
    limit,
  };

  const {
    data: salesData,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useSalesList(queryFilters);

  const rawSales = salesData?.items ?? [];
  const totalRecords = salesData?.total ?? 0;
  const totalPages = salesData?.totalPages ?? 1;

  // Client-side text filter on the loaded page for instant response
  const filteredSales = rawSales.filter((sale) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchInvoice = sale.invoiceNo.toLowerCase().includes(q);
    const matchMenu = sale.items.some((item) => item.menuNameSnapshot.toLowerCase().includes(q));
    const matchCashier = sale.cashier?.name.toLowerCase().includes(q);
    return matchInvoice || matchMenu || matchCashier;
  });

  const handleResetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPaymentMethod("ALL");
    setPage(1);
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const handlePaymentMethodChange = (pm: PaymentMethod | "ALL") => {
    setPaymentMethod(pm);
    setPage(1);
  };

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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Riwayat Penjualan
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Daftar seluruh transaksi kasir dan detail alokasi stok batch FEFO.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-amber-600" : ""}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* KPI Cards Overview */}
      <SaleKpiCards sales={rawSales} totalTransactions={totalRecords} isOwner={isOwner} />

      {/* Filters Bar */}
      <SaleFiltersBar
        search={search}
        onSearchChange={setSearch}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        onReset={handleResetFilters}
      />

      {/* Main Content Area */}
      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse flex items-center justify-between"
            >
              <div className="space-y-2 w-1/3">
                <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
              </div>
              <div className="h-4 bg-slate-200 rounded-md w-24"></div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
          <p className="text-sm font-bold text-rose-600">
            Gagal memuat riwayat penjualan:{" "}
            {error instanceof Error ? error.message : "Terjadi kesalahan"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Belum Ada Transaksi</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || startDate || endDate || paymentMethod !== "ALL"
              ? "Tidak ada transaksi yang cocok dengan filter yang dipilih."
              : "Transaksi penjualan yang dilakukan kasir akan muncul di sini secara otomatis."}
          </p>
          {(search || startDate || endDate || paymentMethod !== "ALL") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors inline-block mt-2"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
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
                  {filteredSales.map((sale) => {
                    const soldDate = new Date(sale.soldAt);
                    const formattedDate = soldDate.toLocaleDateString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    const formattedTime = soldDate.toLocaleTimeString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    const menuSummary = sale.items
                      .map((item) => `${item.menuNameSnapshot} (${item.qty})`)
                      .join(", ");

                    return (
                      <tr
                        key={sale.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedSale(sale)}
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
                              paymentBadgeColors[sale.paymentMethod] ??
                              "bg-slate-100 text-slate-700"
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
                              setSelectedSale(sale);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition-colors"
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
            {filteredSales.map((sale) => {
              const soldDate = new Date(sale.soldAt);
              const formattedDate = soldDate.toLocaleDateString("id-ID", {
                timeZone: "Asia/Jakarta",
                day: "numeric",
                month: "short",
              });
              const formattedTime = soldDate.toLocaleTimeString("id-ID", {
                timeZone: "Asia/Jakarta",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
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
                          setSelectedSale(sale);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-2xs text-xs text-slate-600">
              <div>
                Halaman <span className="font-bold text-slate-900">{page}</span> dari{" "}
                <span className="font-bold text-slate-900">{totalPages}</span> (Total {totalRecords}{" "}
                transaksi)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sale Detail & FEFO Batch Allocation Modal */}
      <SaleDetailModal
        isOpen={Boolean(selectedSale)}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
        isOwner={isOwner}
      />
    </div>
  );
}

export default SalesPage;
