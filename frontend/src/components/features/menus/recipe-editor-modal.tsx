import { X, Plus, Loader2, BookOpen, AlertCircle } from "lucide-react";
import type { MenuItem } from "../../../api/hooks/use-menus.js";
import { formatRupiah } from "../../../lib/format.js";
import { RecipeRowItem } from "./recipe-row-item.js";
import { RecipeCostPreviewPanel } from "./recipe-cost-preview-panel.js";
import { useRecipeEditor } from "./use-recipe-editor.js";

interface RecipeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: MenuItem;
}

export function RecipeEditorModal({ isOpen, onClose, menu }: RecipeEditorModalProps) {
  const {
    rows,
    ingredients,
    ingredientMap,
    subtotalMap,
    previewData,
    isPreviewLoading,
    isLoadingDetail,
    formError,
    isSaving,
    handleAddRow,
    handleRemoveRow,
    handleRowChange,
    handleSave,
  } = useRecipeEditor(menu, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Resep & Costing: {menu.name}
                </h2>
                {menu.category && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-slate-200/70 text-slate-700 rounded-md">
                    {menu.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Harga Jual:{" "}
                <span className="font-bold text-slate-800 tabular-nums">
                  {formatRupiah(menu.sellingPrice)}
                </span>{" "}
                • Target Margin:{" "}
                <span className="font-bold text-slate-800">
                  {menu.targetMargin ? `${menu.targetMargin}%` : "Default Usaha"}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Daftar Bahan & Takaran Usable</h3>
                <p className="text-xs text-slate-500">
                  Takaran bersih yang digunakan untuk 1 porsi menu.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRow}
                disabled={rows.length >= 30}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Bahan
              </button>
            </div>

            {formError && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {isLoadingDetail ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                <p className="text-xs">Memuat resep menu...</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <p className="text-xs text-slate-500">Belum ada bahan baku dalam resep ini.</p>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl cursor-pointer"
                >
                  + Tambah Bahan Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {rows.map((row, index) => (
                  <RecipeRowItem
                    key={row.rowId}
                    row={row}
                    index={index}
                    ingredients={ingredients}
                    ingredientMap={ingredientMap}
                    subtotal={subtotalMap.get(row.ingredientId)}
                    canRemove={rows.length > 1}
                    onRemove={handleRemoveRow}
                    onChange={handleRowChange}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-4">
            <RecipeCostPreviewPanel
              previewData={previewData}
              isPreviewLoading={isPreviewLoading}
              menu={menu}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || rows.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs shadow-emerald-700/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan Resep Menu
          </button>
        </div>
      </div>
    </div>
  );
}
