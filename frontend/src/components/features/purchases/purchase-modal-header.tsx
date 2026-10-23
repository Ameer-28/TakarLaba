import { Receipt, X } from "lucide-react";

interface PurchaseModalHeaderProps {
  onClose: () => void;
}

export function PurchaseModalHeader({ onClose }: PurchaseModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Receipt className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Catat Nota Belanja Bahan</h3>
          <p className="text-xs text-slate-500">
            Pencatatan nota otomatis menambah batch stok (FEFO) dan memperbarui biaya riil.
          </p>
        </div>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
