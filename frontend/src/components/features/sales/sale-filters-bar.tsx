import { useMemo } from "react";
import { Search, X, CreditCard, Banknote, QrCode, ArrowRightLeft, RotateCcw } from "lucide-react";
import type { PaymentMethod } from "../../../api/hooks/use-sales.js";
import { Calendar as DateRangePicker, type RangeValue } from "../../ui/calendar.js";
import { parseYMD, formatToYMD } from "../../ui/calendar-utils.js";
import { DropdownNavigation, type NavItem } from "../../ui/dropdown-navigation.js";

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

  const paymentNavItems: NavItem[] = [
    {
      id: "payment-method",
      label:
        paymentMethod === "ALL"
          ? "Metode Pembayaran"
          : paymentMethod === "CASH"
            ? "Bayar: Tunai"
            : paymentMethod === "QRIS"
              ? "Bayar: QRIS"
              : "Bayar: Transfer",
      active: paymentMethod !== "ALL",
      align: "left",
      subMenus: [
        {
          title: "Pilih Metode Pembayaran",
          items: [
            {
              label: "Semua Bayar",
              description: "Tampilkan seluruh metode pembayaran transaksi",
              icon: CreditCard,
              active: paymentMethod === "ALL",
              onClick: () => onPaymentMethodChange("ALL"),
            },
            {
              label: "Tunai (Cash)",
              description: "Pembayaran langsung menggunakan uang tunai fisik",
              icon: Banknote,
              active: paymentMethod === "CASH",
              onClick: () => onPaymentMethodChange("CASH"),
            },
            {
              label: "QRIS",
              description: "Pembayaran digital instan via kode QRIS",
              icon: QrCode,
              active: paymentMethod === "QRIS",
              onClick: () => onPaymentMethodChange("QRIS"),
            },
            {
              label: "Transfer Bank",
              description: "Pembayaran transfer antar bank atau rekening bisnis",
              icon: ArrowRightLeft,
              active: paymentMethod === "TRANSFER",
              onClick: () => onPaymentMethodChange("TRANSFER"),
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#CCD0CF] shadow-xs space-y-3">
      {/* Search Input (Baris Atas - Lebar Penuh) */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-[#4A5C6A] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari no. struk atau nama menu..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-[#CCD0CF] text-[#06141B] placeholder:text-[#4A5C6A] focus:outline-hidden focus:border-[#253745] focus:ring-1 focus:ring-[#253745]/20 transition-all bg-slate-50/50"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5C6A] hover:text-[#06141B] cursor-pointer p-0.5"
            title="Hapus pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Controls Row (Baris Bawah): Periode Transaksi, Metode Pembayaran & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Periode Transaksi Date Range Picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#4A5C6A] whitespace-nowrap">Periode:</span>
            <DateRangePicker
              value={rangeValue}
              onChange={handleRangeChange}
              allowClear
              placeholder="Pilih Periode Transaksi"
              popoverAlignment="start"
            />
          </div>

          {/* Payment Method Dropdown Navigation */}
          <DropdownNavigation navItems={paymentNavItems} />
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-full transition-all cursor-pointer whitespace-nowrap"
            title="Reset semua filter transaksi"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default SaleFiltersBar;
