import { AlertTriangle, Loader2 } from "lucide-react";
import type { OverheadCost } from "./types.js";

interface OverheadDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  overhead: OverheadCost | null;
  isDeleting?: boolean;
}

export function OverheadDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  overhead,
  isDeleting = false,
}: OverheadDeleteModalProps) {
  if (!isOpen || !overhead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Hapus Beban Overhead?</h3>
            <p className="text-xs text-slate-600 mt-1">
              Apakah Anda yakin ingin menghapus beban <strong>{overhead.name}</strong>? Tindakan ini
              akan memperbarui perhitungan beban overhead per porsi.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
