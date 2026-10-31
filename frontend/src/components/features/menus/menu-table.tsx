import { BookOpen, AlertCircle, Pencil, Trash2 } from "lucide-react";
import type { MenuItem } from "../../../api/hooks/use-menus.js";
import { formatRupiah } from "../../../lib/format.js";
import { MarginBadge } from "./margin-badge.js";

interface MenuTableProps {
  menus: MenuItem[];
  defaultBusinessMargin: string;
  onOpenRecipe: (menu: MenuItem) => void;
  onOpenEdit: (menu: MenuItem) => void;
  onOpenDelete: (menu: MenuItem) => void;
  onToggleActive: (menu: MenuItem) => void;
}

export function MenuTable({
  menus,
  defaultBusinessMargin,
  onOpenRecipe,
  onOpenEdit,
  onOpenDelete,
  onToggleActive,
}: MenuTableProps) {
  return (
    <>
      {/* Desktop & Tablet Table (md & up) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Menu & Kategori</th>
              <th className="py-3 px-4">Harga Jual</th>
              <th className="py-3 px-4">HPP Bahan vs Penuh</th>
              <th className="py-3 px-4">Margin Kontribusi</th>
              <th className="py-3 px-4">Status Margin</th>
              <th className="py-3 px-4">Resep</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {menus.map((menu) => {
              const cost = menu.costSummary;
              const isCostReady = menu.hasRecipe && cost?.isCostComplete;

              return (
                <tr key={menu.id} className="hover:bg-slate-50/60 transition-colors group">
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
                        <div className="font-bold text-slate-900">
                          {formatRupiah(cost.marginKontribusi)}
                        </div>
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
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (< md: 360px+) */}
      <div className="md:hidden divide-y divide-slate-100">
        {menus.map((menu) => {
          const cost = menu.costSummary;
          const isCostReady = menu.hasRecipe && cost?.isCostComplete;

          return (
            <div key={menu.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{menu.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {menu.category ? (
                      <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-md">
                        {menu.category}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Tanpa kategori</span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 tabular-nums font-semibold">
                      Target {menu.targetMargin ?? defaultBusinessMargin}%
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleActive(menu)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer shrink-0 ${
                    menu.isActive
                      ? "bg-emerald-100/80 text-emerald-800"
                      : "bg-slate-100 text-slate-500"
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

              {/* Price and Costing Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Harga Jual</span>
                  <span className="font-bold text-slate-900 text-sm tabular-nums">
                    {formatRupiah(menu.sellingPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Margin Kontribusi</span>
                  <span className="font-bold text-slate-900 text-sm tabular-nums">
                    {isCostReady && cost.marginKontribusi
                      ? formatRupiah(cost.marginKontribusi)
                      : "-"}
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400 block font-medium">HPP Bahan</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {isCostReady && cost.hppBahan ? formatRupiah(cost.hppBahan) : "-"}
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400 block font-medium">HPP Penuh (+Ovh)</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {isCostReady && cost.hppPenuh ? formatRupiah(cost.hppPenuh) : "-"}
                  </span>
                </div>
              </div>

              {/* Margin Safety Badge & Actions */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <MarginBadge
                  costSummary={menu.costSummary}
                  hasRecipe={menu.hasRecipe}
                  targetMargin={menu.targetMargin}
                  defaultBusinessMargin={defaultBusinessMargin}
                />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenRecipe(menu)}
                    className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Resep</span>
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
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
