import { useState } from "react";
import { Receipt, RefreshCw } from "lucide-react";
import { useSalesList, type SaleDetail, type PaymentMethod } from "../api/hooks/use-sales.js";
import { useSession } from "../lib/auth-client.js";
import { SaleKpiCards } from "../components/features/sales/sale-kpi-cards.js";
import { SaleFiltersBar } from "../components/features/sales/sale-filters-bar.js";
import { SaleDetailModal } from "../components/features/sales/sale-detail-modal.js";
import { SaleTable } from "../components/features/sales/sale-table.js";
import { SalePagination } from "../components/features/sales/sale-pagination.js";

export function SalesPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;

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
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
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
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
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
              className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors inline-block mt-2 cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <SaleTable sales={filteredSales} isOwner={isOwner} onSelectSale={setSelectedSale} />
          <SalePagination
            page={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            onPageChange={setPage}
          />
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
