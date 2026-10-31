import { Check } from "lucide-react";
import { formatRupiah } from "../../../lib/format.js";

interface CashPaymentFieldsProps {
  cashReceived: number;
  totalAmount: number;
  change: number;
  isCashInsufficient: boolean;
  quickCashOptions: number[];
  onChangeInput: (val: string) => void;
  onSelectOption: (amount: number) => void;
}

export function CashPaymentFields({
  cashReceived,
  totalAmount,
  change,
  isCashInsufficient,
  quickCashOptions,
  onChangeInput,
  onSelectOption,
}: CashPaymentFieldsProps) {
  return (
    <div className="space-y-3 pt-1">
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
          Uang Diterima (Rp)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={cashReceived ? cashReceived.toLocaleString("id-ID") : ""}
            onChange={(e) => onChangeInput(e.target.value)}
            placeholder="0"
            className="w-full pl-10 pr-4 py-2.5 text-base font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 tabular-nums transition-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {quickCashOptions.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onSelectOption(amount)}
            className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer border ${
              cashReceived === amount
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {amount === totalAmount ? "Uang Pas" : formatRupiah(amount)}
          </button>
        ))}
      </div>

      <div
        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
          isCashInsufficient
            ? "bg-amber-50/70 border-amber-200 text-amber-900"
            : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
        }`}
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider block">
            {isCashInsufficient ? "Kurang Bayar" : "Kembalian"}
          </span>
          <span className="text-xl font-black tabular-nums">
            {formatRupiah(isCashInsufficient ? totalAmount - cashReceived : change)}
          </span>
        </div>

        {!isCashInsufficient && (
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
