import { X, Loader2, UtensilsCrossed } from "lucide-react";
import type { MenuItem } from "./types.js";
import { useMenuModalForm } from "./use-menu-modal-form.js";
import { MenuModalFields } from "./menu-modal-fields.js";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    category?: string | null;
    sellingPrice: number;
    targetMargin?: number | null;
    isActive?: boolean;
  }) => Promise<void>;
  initialData?: MenuItem | null;
  isSaving?: boolean;
  defaultBusinessMargin?: string;
}

export function MenuModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving = false,
  defaultBusinessMargin = "50",
}: MenuModalProps) {
  const {
    name,
    setName,
    category,
    setCategory,
    sellingPrice,
    setSellingPrice,
    targetMargin,
    setTargetMargin,
    isActive,
    setIsActive,
    error,
    handleSubmit,
  } = useMenuModalForm({
    isOpen,
    initialData,
    onSave,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {initialData ? "Ubah Rincian Menu" : "Tambah Menu Baru"}
              </h2>
              <p className="text-xs text-slate-500">
                {initialData
                  ? "Perubahan harga jual akan tercatat di riwayat harga"
                  : "Daftarkan menu yang akan dijual di POS dan dihitung HPP-nya"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <MenuModalFields
            name={name}
            setName={setName}
            category={category}
            setCategory={setCategory}
            sellingPrice={sellingPrice}
            setSellingPrice={setSellingPrice}
            targetMargin={targetMargin}
            setTargetMargin={setTargetMargin}
            isActive={isActive}
            setIsActive={setIsActive}
            defaultBusinessMargin={defaultBusinessMargin}
          />

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs shadow-emerald-700/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialData ? "Simpan Perubahan" : "Tambah Menu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
