import { useState, useMemo } from "react";
import {
  ShoppingBag,
  Receipt,
  Search,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
  Ban,
  FilterX,
} from "lucide-react";
import { usePurchases, type PurchaseRecord } from "@/api/hooks/use-purchases";
import { formatRupiah, formatDate } from "@/lib/format";
import { Calendar as DateRangePicker, type RangeValue } from "@/components/ui/calendar";
import { parseYMD, formatToYMD } from "@/components/ui/calendar-utils";
import { PurchaseBatchDetailModal } from "./purchases/purchase-batch-detail-modal";
import { PurchaseVoidModal } from "./purchases/purchase-void-modal";

interface PurchaseHistoryProps {
  onOpenCreate: () => void;
}

export function PurchaseHistory({ onOpenCreate }: PurchaseHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);
  const [voidingPurchase, setVoidingPurchase] = useState<PurchaseRecord | null>(null);

  const {
    data: purchases = [],
    isPending,
    isError,
    error,
    refetch,
  } = usePurchases({
    supplier: searchTerm.trim() ? searchTerm.trim() : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const hasFilter = Boolean(searchTerm.trim() || startDate || endDate);

  const rangeValue: RangeValue | null = useMemo(() => {
    if (!startDate && !endDate) return null;
    return {
      start: startDate ? parseYMD(startDate) : null,
      end: endDate ? parseYMD(endDate) : null,
    };
  }, [startDate, endDate]);

  const handleRangeChange = (val: RangeValue | null) => {
    if (!val || (!val.start && !val.end)) {
      setStartDate("");
      setEndDate("");
    } else if (val.start && val.end) {
      setStartDate(formatToYMD(val.start));
      setEndDate(formatToYMD(val.end));
    } else if (val.start) {
      setStartDate(formatToYMD(val.start));
      setEndDate(formatToYMD(val.start));
    }
  };

  const handleResetFilter = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#CCD0CF] p-4 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#4A5C6A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by supplier or store name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#CCD0CF] text-xs text-[#06141B] focus:outline-hidden focus:ring-2 focus:ring-[#253745]/20 focus:border-[#253745] placeholder:text-[#4A5C6A] bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <DateRangePicker
              value={rangeValue}
              onChange={handleRangeChange}
              allowClear
              placeholder="Select Purchase Period"
              popoverAlignment="start"
            />

            {hasFilter && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                title="Reset Filters"
              >
                <FilterX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all justify-center cursor-pointer"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Record New Invoice</span>
        </button>
      </div>

      {isPending ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading purchase history...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-xs text-slate-600">
            {error instanceof Error ? error.message : "Failed to load purchase history."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : purchases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {hasFilter ? "No Invoices Match Filters" : "No Purchase Invoices Yet"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {hasFilter
              ? "Try changing your search keywords or purchase date range."
              : "Record your first purchase invoice to restock ingredients and track FEFO inventory batches."}
          </p>
          {hasFilter ? (
            <button
              onClick={handleResetFilter}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-all cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          ) : (
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Record Purchase Invoice</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {purchases.map((purchase) => {
              const totalAmountNum = Number(purchase.totalAmount);
              const batchCount = purchase.batches?.length ?? 0;
              const isVoided = Boolean(purchase.note?.startsWith("[DIBATALKAN"));

              return (
                <div
                  key={purchase.id}
                  className={`p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isVoided ? "opacity-75 bg-slate-50/40" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {purchase.supplierName || "General Store / Purchase"}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        #{purchase.id.slice(-6)}
                      </span>
                      {isVoided && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <Ban className="w-3 h-3" />
                          <span>Voided</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(purchase.purchasedAt)}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 font-medium">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {batchCount} item{batchCount === 1 ? "" : "s"} purchased
                        </span>
                      </span>

                      {purchase.note && (
                        <span className="text-slate-500 italic max-w-md truncate">
                          &ldquo;{purchase.note}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block">Invoice Total</span>
                      <span
                        className={`font-bold text-base tabular-nums ${
                          isVoided ? "line-through text-slate-400" : "text-slate-900"
                        }`}
                      >
                        {formatRupiah(totalAmountNum)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPurchase(purchase)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        View Batches
                      </button>

                      {!isVoided && (
                        <button
                          type="button"
                          onClick={() => setVoidingPurchase(purchase)}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Void this purchase invoice"
                        >
                          Void
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PurchaseBatchDetailModal
        purchase={selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        onOpenVoid={(p) => setVoidingPurchase(p)}
      />

      <PurchaseVoidModal
        isOpen={Boolean(voidingPurchase)}
        onClose={() => setVoidingPurchase(null)}
        purchase={voidingPurchase}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default PurchaseHistory;
