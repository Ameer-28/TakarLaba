import { Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";

interface PurchaseModalFooterProps {
  totalAmount: number;
  onCancel: () => void;
  isPending: boolean;
  canSubmit: boolean;
}

export function PurchaseModalFooter({
  totalAmount,
  onCancel,
  isPending,
  canSubmit,
}: PurchaseModalFooterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white shadow-sm">
      <div>
        <span className="text-xs text-slate-400 block">Total Nilai Pembelian</span>
        <span className="text-xl font-bold font-mono tabular-nums text-emerald-400">
          {formatRupiah(totalAmount)}
        </span>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Menyimpan Nota...</span>
            </>
          ) : (
            <span>Simpan Nota Belanja</span>
          )}
        </button>
      </div>
    </div>
  );
}
