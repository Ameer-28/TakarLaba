import { Percent } from "lucide-react";
import { DEFAULT_MENU_CATEGORIES } from "./types.js";

interface MenuModalFieldsProps {
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  sellingPrice: string;
  setSellingPrice: (v: string) => void;
  targetMargin: string;
  setTargetMargin: (v: string) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  defaultBusinessMargin: string;
}

export function MenuModalFields({
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
  defaultBusinessMargin,
}: MenuModalFieldsProps) {
  return (
    <>
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
    </>
  );
}
