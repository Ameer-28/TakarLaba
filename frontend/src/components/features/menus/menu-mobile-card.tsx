import { BookOpen, AlertCircle, Pencil, Trash2 } from "lucide-react";
import type { MenuItem } from "../../../api/hooks/use-menus.js";
import { formatRupiah } from "../../../lib/format.js";
import { MarginBadge } from "./margin-badge.js";

interface MenuMobileCardProps {
  menu: MenuItem;
  defaultBusinessMargin: string;
  onOpenRecipe: (menu: MenuItem) => void;
  onOpenEdit: (menu: MenuItem) => void;
  onOpenDelete: (menu: MenuItem) => void;
  onToggleActive: (menu: MenuItem) => void;
}

export function MenuMobileCard({
  menu,
  defaultBusinessMargin,
  onOpenRecipe,
  onOpenEdit,
  onOpenDelete,
  onToggleActive,
}: MenuMobileCardProps) {
  const cost = menu.costSummary;
  const isCostReady = menu.hasRecipe && cost?.isCostComplete;

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3">
      {/* Top row: Name, Category, and Active Toggle */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0 border border-emerald-100 text-sm">
            {menu.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">{menu.name}</h3>
            <span className="text-[11px] font-semibold text-slate-500">
              {menu.category ?? "Tanpa kategori"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleActive(menu)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full transition-colors ${
            menu.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              menu.isActive ? "bg-emerald-600" : "bg-slate-400"
            }`}
          />
          {menu.isActive ? "Aktif" : "Nonaktif"}
        </button>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/70 rounded-xl text-xs">
        <div>
          <span className="text-slate-400 block mb-0.5">Harga Jual</span>
          <span className="font-bold text-slate-900 tabular-nums text-sm">
            {formatRupiah(menu.sellingPrice)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">HPP Bahan</span>
          <span className="font-bold text-slate-800 tabular-nums">
            {isCostReady && cost.hppBahan ? formatRupiah(cost.hppBahan) : "-"}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">HPP Penuh</span>
          <span className="font-bold text-slate-800 tabular-nums">
            {isCostReady && cost.hppPenuh ? formatRupiah(cost.hppPenuh) : "-"}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Margin Kontribusi</span>
          <span className="font-bold text-slate-900 tabular-nums">
            {isCostReady && cost.marginKontribusi ? formatRupiah(cost.marginKontribusi) : "-"}
          </span>
        </div>
      </div>

      {/* Margin Status & Recipe Trigger Button */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <MarginBadge
          costSummary={menu.costSummary}
          hasRecipe={menu.hasRecipe}
          targetMargin={menu.targetMargin}
          defaultBusinessMargin={defaultBusinessMargin}
        />
        <button
          type="button"
          onClick={() => onOpenRecipe(menu)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200/60 rounded-lg hover:bg-sky-100 transition-colors"
        >
          {menu.hasRecipe ? (
            <>
              <BookOpen className="w-3.5 h-3.5" />
              {menu.recipeItemsCount} Bahan
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-amber-700">Atur Resep</span>
            </>
          )}
        </button>
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => onOpenEdit(menu)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
        >
          <Pencil className="w-3.5 h-3.5" />
          Ubah
        </button>
        <button
          type="button"
          onClick={() => onOpenDelete(menu)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Hapus
        </button>
      </div>
    </div>
  );
}
