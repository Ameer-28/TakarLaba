import { Banknote, QrCode, ArrowRightLeft } from "lucide-react";
import type { PaymentMethod } from "../../../api/hooks/use-sales.js";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
        Metode Pembayaran
      </label>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onChange("CASH")}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
            value === "CASH"
              ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
          <span className="text-xs">Tunai</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("QRIS")}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
            value === "QRIS"
              ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <QrCode className="w-5 h-5 mb-1 text-sky-600" />
          <span className="text-xs">QRIS</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("TRANSFER")}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
            value === "TRANSFER"
              ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ArrowRightLeft className="w-5 h-5 mb-1 text-purple-600" />
          <span className="text-xs">Transfer</span>
        </button>
      </div>
    </div>
  );
}
