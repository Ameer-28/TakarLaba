import { Calendar, Clock, User, CreditCard } from "lucide-react";
import { formatDate, formatTime } from "../../../lib/format.js";
import type { SaleDetail } from "../../../api/hooks/use-sales.js";

interface SaleMetadataPillsProps {
  sale: SaleDetail;
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

export function SaleMetadataPills({ sale }: SaleMetadataPillsProps) {
  const formattedDate = formatDate(sale.soldAt);
  const formattedTime = formatTime(sale.soldAt);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span className="text-slate-400 flex items-center gap-1 mb-1">
          <Calendar className="w-3.5 h-3.5" /> Tanggal
        </span>
        <span className="font-bold text-slate-800">{formattedDate}</span>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span className="text-slate-400 flex items-center gap-1 mb-1">
          <Clock className="w-3.5 h-3.5" /> Waktu
        </span>
        <span className="font-bold text-slate-800">{formattedTime} WIB</span>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span className="text-slate-400 flex items-center gap-1 mb-1">
          <User className="w-3.5 h-3.5" /> Kasir
        </span>
        <span className="font-bold text-slate-800 truncate block">
          {sale.cashier?.name ?? "Kasir"}
        </span>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span className="text-slate-400 flex items-center gap-1 mb-1">
          <CreditCard className="w-3.5 h-3.5" /> Pembayaran
        </span>
        <span
          className={`inline-block font-bold px-2 py-0.5 rounded-md border text-[11px] ${
            paymentBadgeColors[sale.paymentMethod] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          {paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}
        </span>
      </div>
    </div>
  );
}
