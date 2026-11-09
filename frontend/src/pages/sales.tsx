import { useState } from "react";
import { Receipt, RefreshCw, Download } from "lucide-react";
import { useSalesList, type SaleDetail, type PaymentMethod } from "../api/hooks/use-sales.js";
import { useSession } from "../lib/auth-client.js";
import { downloadCsv } from "../lib/export.js";
import {
  SaleKpiCards,
  SaleFiltersBar,
  SaleDetailModal,
  SaleTable,
  SalePagination,
} from "../components/features/sales";

export function SalesPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
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

  const handleExportCsv = async () => {
    setIsExporting(true);
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("status", "ALL");
    const query = params.toString() ? `?${params.toString()}` : "";
    await downloadCsv(`/export/sales.csv${query}`, "sales.csv");
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sales History
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            All cashier sales transactions and FEFO batch inventory deductions.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isOwner && (
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? "animate-bounce" : ""}`} />
              <span>{isExporting ? "Downloading..." : "Export CSV"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-amber-600" : ""}`}
            />
            <span>Reload</span>
          </button>
        </div>
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
            Failed to load sales history:{" "}
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">No Transactions Yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || startDate || endDate || paymentMethod !== "ALL"
              ? "No transactions matched the selected filters."
              : "Sales transactions completed at checkout will appear here automatically."}
          </p>
          {(search || startDate || endDate || paymentMethod !== "ALL") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors inline-block mt-2 cursor-pointer"
            >
              Reset Filters
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
        onVoidSuccess={(updated) => {
          setSelectedSale(updated);
          refetch();
        }}
      />
    </div>
  );
}

export default SalesPage;
