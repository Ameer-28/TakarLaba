import React, { useState, useEffect } from "react";
import { X, Loader2, UtensilsCrossed, Percent } from "lucide-react";
import type { MenuItem } from "./types.js";
import { DEFAULT_MENU_CATEGORIES } from "./types.js";

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
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [targetMargin, setTargetMargin] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category ?? "");
      setSellingPrice(Math.round(Number(initialData.sellingPrice)).toString());
      setTargetMargin(
        initialData.targetMargin ? Math.round(Number(initialData.targetMargin)).toString() : ""
      );
      setIsActive(initialData.isActive);
    } else {
      setName("");
      setCategory("");
      setSellingPrice("");
      setTargetMargin("");
      setIsActive(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError("Nama menu minimal 2 karakter");
      return;
    }

    const priceNum = Number(sellingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Harga jual harus lebih besar dari Rp 0");
      return;
    }
    if (priceNum > 100_000_000) {
      setError("Harga jual tidak boleh melebihi Rp 100.000.000");
      return;
    }

    let marginVal: number | null = null;
    if (targetMargin.trim() !== "") {
      const marginNum = Number(targetMargin);
      if (isNaN(marginNum) || marginNum < 0 || marginNum > 95) {
        setError("Target margin harus di antara 0% dan 95%");
        return;
      }
      marginVal = marginNum;
    }

    try {
      await onSave({
        name: trimmedName,
        category: category.trim() ? category.trim() : null,
        sellingPrice: priceNum,
        targetMargin: marginVal,
        isActive,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat menyimpan menu");
      }
    }
  };

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

          {/* Nama Menu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Menu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kopi Susu Gula Aren, Croissant Keju"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kategori Menu
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Pilih atau ketik kategori baru"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
            />
            {/* Quick Category Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {DEFAULT_MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    category === cat
                      ? "bg-emerald-600 text-white font-medium"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Harga Jual */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Harga Jual (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0"
                className="w-full pl-11 pr-3.5 py-2.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all tabular-nums placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Harga jual bruto sebelum diskon atau promosi kasir.
            </p>
          </div>

          {/* Target Margin (%) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Target Margin Khusus (%)
              </label>
              <span className="text-[11px] text-slate-400">Opsional</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="95"
                step="1"
                value={targetMargin}
                onChange={(e) => setTargetMargin(e.target.value)}
                placeholder={`Default usaha: ${defaultBusinessMargin}%`}
                className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all tabular-nums placeholder:text-slate-400"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Percent className="w-4 h-4" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Kosongkan jika ingin mengikuti target margin global usaha ({defaultBusinessMargin}%).
            </p>
          </div>

          {/* Status Aktif */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">Status Menu Aktif</p>
              <p className="text-xs text-slate-500">
                Menu aktif dapat dipesan di kasir (jika resep sudah ada).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

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
