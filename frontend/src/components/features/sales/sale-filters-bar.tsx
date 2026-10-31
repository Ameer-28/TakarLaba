import { Search, Calendar, Filter, X } from "lucide-react";
import type { PaymentMethod } from "../../../api/hooks/use-sales.js";

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
  // Helpers for preset date selections in WIB
  const setPreset = (preset: "today" | "7d" | "30d" | "all") => {
    if (preset === "all") {
      onDateChange("", "");
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]!;

    if (preset === "today") {
      onDateChange(todayStr, todayStr);
      return;
    }

    if (preset === "7d") {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      onDateChange(past7.toISOString().split("T")[0]!, todayStr);
      return;
    }

    if (preset === "30d") {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      onDateChange(past30.toISOString().split("T")[0]!, todayStr);
      return;
    }
  };

  const hasActiveFilters = Boolean(search || startDate || endDate || paymentMethod !== "ALL");

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
      {/* Search & Payment Method Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. struk atau nama menu..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all bg-slate-50/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                paymentMethod === pm.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {pm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Filter & Presets Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
        {/* Date Presets */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-slate-400 text-[11px] font-semibold mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Periode:
          </span>
          <button
            type="button"
            onClick={() => setPreset("today")}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-[11px]"
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => setPreset("7d")}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-[11px]"
          >
            7 Hari
          </button>
          <button
            type="button"
            onClick={() => setPreset("30d")}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-[11px]"
          >
            30 Hari
          </button>
          <button
            type="button"
            onClick={() => setPreset("all")}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-[11px]"
          >
            Semua
          </button>
        </div>

        {/* Custom Date Inputs */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateChange(e.target.value, endDate)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:border-amber-500"
            title="Tanggal mulai"
          />
          <span className="text-slate-400 text-xs">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateChange(startDate, e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:border-amber-500"
            title="Tanggal selesai"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 ml-1 px-2 py-1 rounded-md hover:bg-rose-50"
            >
              <Filter className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
