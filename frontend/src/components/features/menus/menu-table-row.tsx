import { BookOpen, AlertCircle, Pencil, Trash2 } from "lucide-react";
import type { MenuItem } from "../../../api/hooks/use-menus.js";
import { formatRupiah } from "../../../lib/format.js";
import { MarginBadge } from "./margin-badge.js";

interface MenuTableRowProps {
  menu: MenuItem;
  defaultBusinessMargin: string;
  onOpenRecipe: (menu: MenuItem) => void;
  onOpenEdit: (menu: MenuItem) => void;
  onOpenDelete: (menu: MenuItem) => void;
  onToggleActive: (menu: MenuItem) => void;
}

export function MenuTableRow({
  menu,
  defaultBusinessMargin,
  onOpenRecipe,
  onOpenEdit,
  onOpenDelete,
  onToggleActive,
}: MenuTableRowProps) {
  const cost = menu.costSummary;
  const isCostReady = menu.hasRecipe && cost?.isCostComplete;

  return (
    <tr className="hover:bg-slate-50/60 transition-colors group">
      {/* Menu Name & Category */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0 border border-emerald-100 text-sm">
            {menu.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              {menu.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {menu.category ? (
                <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-md">
                  {menu.category}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Tanpa kategori</span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Harga Jual */}
      <td className="py-3.5 px-4 tabular-nums font-bold text-slate-900">
        {formatRupiah(menu.sellingPrice)}
      </td>

      {/* HPP Bahan vs HPP Penuh */}
      <td className="py-3.5 px-4 tabular-nums">
        {isCostReady && cost.hppBahan && cost.hppPenuh ? (
          <div>
            <div className="font-semibold text-slate-800">
              {formatRupiah(cost.hppBahan)}
              <span className="text-slate-400 font-normal text-xs ml-1">(Bahan)</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {formatRupiah(cost.hppPenuh)}
              <span className="text-[11px] text-slate-400 ml-1">
                (+{formatRupiah(cost.overheadPerPortion)} ovh)
              </span>
            </div>
          </div>
        ) : menu.hasRecipe ? (
          <span className="text-xs text-amber-700 font-medium">Belum lengkap</span>
        ) : (
          <span className="text-xs text-slate-400 font-medium">-</span>
        )}
      </td>

      {/* Margin Kontribusi */}
      <td className="py-3.5 px-4 tabular-nums">
        {isCostReady && cost.marginKontribusi && cost.marginPercent ? (
          <div>
            <div className="font-bold text-slate-900">{formatRupiah(cost.marginKontribusi)}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              Target: {menu.targetMargin ?? defaultBusinessMargin}%
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium">-</span>
        )}
      </td>

      {/* Status Margin Badge */}
      <td className="py-3.5 px-4">
        <MarginBadge
          costSummary={menu.costSummary}
          hasRecipe={menu.hasRecipe}
          targetMargin={menu.targetMargin}
          defaultBusinessMargin={defaultBusinessMargin}
        />
      </td>

      {/* Status Resep Button */}
      <td className="py-3.5 px-4">
        <button
          type="button"
          onClick={() => onOpenRecipe(menu)}
          className="group/badge cursor-pointer text-left"
          title="Klik untuk melihat atau mengatur resep"
        >
          {menu.hasRecipe ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200/60 rounded-lg group-hover/badge:bg-sky-100 transition-colors">
              <BookOpen className="w-3.5 h-3.5" />
              {menu.recipeItemsCount} Bahan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg group-hover/badge:bg-amber-100 transition-colors">
              <AlertCircle className="w-3.5 h-3.5" />
              Belum Ada Resep
            </span>
          )}
        </button>
      </td>

      {/* Status Aktif Switch */}
      <td className="py-3.5 px-4 text-center">
        <button
          type="button"
          onClick={() => onToggleActive(menu)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer ${
            menu.isActive
              ? "bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          title="Klik untuk mengubah status aktif"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              menu.isActive ? "bg-emerald-600" : "bg-slate-400"
            }`}
          />
          {menu.isActive ? "Aktif" : "Nonaktif"}
        </button>
      </td>

      {/* Actions */}
      <td className="py-3.5 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onOpenRecipe(menu)}
            className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
            title="Atur takaran resep & costing"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenEdit(menu)}
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
            title="Ubah rincian menu"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenDelete(menu)}
            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus menu"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
