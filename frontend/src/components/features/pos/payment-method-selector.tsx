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
              ? "bg-[#11212D] border-[#11212D] text-white font-bold shadow-xs"
              : "bg-white border-[#CCD0CF] text-[#4A5C6A] hover:bg-[#CCD0CF]/20 hover:text-[#06141B]"
          }`}
        >
          <Banknote
            className={`w-5 h-5 mb-1 ${value === "CASH" ? "text-[#CCD0CF]" : "text-[#253745]"}`}
          />
          <span className="text-xs">Tunai</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("QRIS")}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
            value === "QRIS"
              ? "bg-[#11212D] border-[#11212D] text-white font-bold shadow-xs"
              : "bg-white border-[#CCD0CF] text-[#4A5C6A] hover:bg-[#CCD0CF]/20 hover:text-[#06141B]"
          }`}
        >
          <QrCode
            className={`w-5 h-5 mb-1 ${value === "QRIS" ? "text-[#CCD0CF]" : "text-sky-600"}`}
          />
          <span className="text-xs">QRIS</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("TRANSFER")}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
            value === "TRANSFER"
              ? "bg-[#11212D] border-[#11212D] text-white font-bold shadow-xs"
              : "bg-white border-[#CCD0CF] text-[#4A5C6A] hover:bg-[#CCD0CF]/20 hover:text-[#06141B]"
          }`}
        >
          <ArrowRightLeft
            className={`w-5 h-5 mb-1 ${value === "TRANSFER" ? "text-[#CCD0CF]" : "text-indigo-600"}`}
          />
          <span className="text-xs">Transfer</span>
        </button>
      </div>
    </div>
  );
}
