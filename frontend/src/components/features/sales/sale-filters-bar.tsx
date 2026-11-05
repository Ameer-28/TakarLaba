import { useMemo } from "react";
import { Search, Filter, X } from "lucide-react";
import type { PaymentMethod } from "../../../api/hooks/use-sales.js";
import { Calendar as DateRangePicker, type RangeValue } from "../../ui/calendar.js";
import { parseYMD, formatToYMD } from "../../ui/calendar-utils.js";

interface SaleFiltersBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  paymentMethod: PaymentMethod | "ALL";
  onPaymentMethodChange: (val: PaymentMethod | "ALL") => void;
  onReset: () => void;
}

export function SaleFiltersBar({
  search,
  onSearchChange,
  startDate,
  endDate,
  onDateChange,
  paymentMethod,
  onPaymentMethodChange,
  onReset,
}: SaleFiltersBarProps) {
  const rangeValue: RangeValue | null = useMemo(() => {
    if (!startDate && !endDate) return null;
    return {
      start: startDate ? parseYMD(startDate) : null,
      end: endDate ? parseYMD(endDate) : null,
    };
  }, [startDate, endDate]);

  const handleRangeChange = (val: RangeValue | null) => {
    if (!val || (!val.start && !val.end)) {
      onDateChange("", "");
    } else if (val.start && val.end) {
      onDateChange(formatToYMD(val.start), formatToYMD(val.end));
    } else if (val.start) {
      onDateChange(formatToYMD(val.start), formatToYMD(val.start));
    }
  };

  const hasActiveFilters = Boolean(search || startDate || endDate || paymentMethod !== "ALL");

  return (
    <div className="bg-white p-4 rounded-2xl border border-[#CCD0CF] shadow-2xs space-y-3">
      {/* Search & Payment Method Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#4A5C6A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. struk atau nama menu..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CCD0CF] text-xs text-[#06141B] placeholder:text-[#4A5C6A] focus:outline-hidden focus:border-[#253745] focus:ring-1 focus:ring-[#253745]/20 transition-all bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5C6A] hover:text-[#06141B] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Payment Method Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: "ALL", label: "Semua Bayar" },
              { id: "CASH", label: "Tunai" },
              { id: "QRIS", label: "QRIS" },
              { id: "TRANSFER", label: "Transfer" },
            ] as const
          ).map((pm) => (
            <button
              key={pm.id}
              type="button"
              onClick={() => onPaymentMethodChange(pm.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                paymentMethod === pm.id
                  ? "bg-[#11212D] text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-[#CCD0CF]/30 text-[#4A5C6A] hover:text-[#06141B]"
              }`}
            >
              {pm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Picker & Filter Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#CCD0CF]/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#4A5C6A] hidden sm:inline-block">
            Periode Transaksi:
          </span>
          <DateRangePicker
            value={rangeValue}
            onChange={handleRangeChange}
            allowClear
            placeholder="Pilih Rentang Tanggal"
            popoverAlignment="start"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Filter className="w-3 h-3" /> Reset Semua Filter
          </button>
        )}
      </div>
    </div>
  );
}
