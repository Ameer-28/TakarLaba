import { useState } from "react";
import { X, Check } from "lucide-react";
import type { AlertListItem } from "@/api/hooks/use-alerts";

interface DismissAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  alert: AlertListItem | null;
  onConfirm: (alertId: string, note?: string) => Promise<void>;
  isPending: boolean;
}

export function DismissAlertDialog({
  isOpen,
  onClose,
  alert,
  onConfirm,
  isPending,
}: DismissAlertDialogProps) {
  const [note, setNote] = useState("");

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(alert.id, note.trim() || undefined);
    setNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Abaikan Peringatan Margin</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menu: <span className="font-semibold text-slate-700">{alert.menu.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 space-y-1">
            <span className="font-bold block">Pemberitahuan:</span>
            <p>
              Dengan mengabaikan peringatan ini, harga jual menu tidak akan diubah. Status
              peringatan akan ditandai sebagai <strong>DISMISSED</strong>.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dismiss-note" className="text-xs font-semibold text-slate-700">
              Alasan atau Catatan Pemilik (Opsional)
            </label>
            <textarea
              id="dismiss-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Menunggu evaluasi harga akhir bulan / promo khusus..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-800 transition-all resize-none"
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isPending ? "Menyimpan..." : "Konfirmasi Abaikan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
