import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Building, Calendar } from "lucide-react";
import type { PurchaseFormValues } from "./purchase-form-types";

interface PurchaseInvoiceFieldsProps {
  register: UseFormRegister<PurchaseFormValues>;
  errors: FieldErrors<PurchaseFormValues>;
  todayStr: string;
}

export function PurchaseInvoiceFields({ register, errors, todayStr }: PurchaseInvoiceFieldsProps) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
        <Building className="w-4 h-4 text-emerald-600" />
        <span>Invoice / Receipt Information</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Purchase Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-[#253745] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              max={todayStr}
              {...register("purchasedAt")}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#CCD0CF] hover:border-[#9BA8AB] text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#253745]/20 focus:border-[#253745] transition-all"
            />
          </div>
          {errors.purchasedAt && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.purchasedAt.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Invoice / Receipt No. (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. INV-2026/03/001"
            {...register("invoiceNumber")}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Supplier / Store Name (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Central Market, Toko Makmur Jaya"
            {...register("supplierName")}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>
    </div>
  );
}
