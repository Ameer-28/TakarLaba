import { useState } from "react";
import { AlertTriangle, Ban, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useVoidSale, type SaleDetail } from "../../../api/hooks/use-sales.js";

interface SaleVoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleDetail | null;
  onSuccess?: (voidedSale: SaleDetail) => void;
}

export function SaleVoidModal({ isOpen, onClose, sale, onSuccess }: SaleVoidModalProps) {
  const [reason, setReason] = useState("");
  const { mutate: voidSale, isPending } = useVoidSale();

  if (!isOpen || !sale) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      toast.error("Alasan pembatalan minimal 3 karakter");
      return;
    }

    voidSale(
      { saleId: sale.id, reason: trimmed },
      {
        onSuccess: (updated) => {
          toast.success(`Transaksi ${sale.invoiceNo} berhasil dibatalkan dan stok dikembalikan`);
          setReason("");
          onSuccess?.(updated);
          onClose();
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Gagal membatalkan transaksi");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Batalkan Transaksi (Void)
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{sale.invoiceNo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Pemulihan Stok Otomatis (VOID_RESTORE)</p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Semua bahan baku yang terpotong saat transaksi ini akan dikembalikan ke batch asal
                masing-masing. Transaksi yang dibatalkan tidak dapat dipulihkan kembali.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="void-reason" className="block text-xs font-bold text-slate-700">
              Alasan Pembatalan <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="void-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Pelanggan salah memesan varian menu, transaksi dibatalkan..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all placeholder:text-slate-400"
              disabled={isPending}
              autoFocus
            />
            <p className="text-[10px] text-slate-400">Minimal 3 karakter, maksimal 255 karakter.</p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || reason.trim().length < 3}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membatalkan...</span>
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5" />
                  <span>Ya, Batalkan Transaksi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
