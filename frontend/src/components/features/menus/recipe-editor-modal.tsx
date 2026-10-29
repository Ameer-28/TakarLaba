import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useMenuDetail,
  useSaveRecipe,
  usePreviewRecipeCost,
  type MenuItem,
  type PreviewCostResponse,
  type RecipeItemInput,
} from "../../../api/hooks/use-menus.js";
import { useIngredients } from "../../../api/hooks/use-ingredients.js";
import { formatRupiah, formatPercent } from "../../../lib/format.js";

interface RecipeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: MenuItem;
}

interface EditorRow {
  rowId: string;
  ingredientId: string;
  qtyUsable: string;
  unitName: string;
}

export function RecipeEditorModal({ isOpen, onClose, menu }: RecipeEditorModalProps) {
  const { data: menuDetail, isPending: isLoadingDetail } = useMenuDetail(menu.id);
  const { data: ingredients = [] } = useIngredients({ isActive: true });
  const saveRecipeMutation = useSaveRecipe();
  const previewCostMutation = usePreviewRecipeCost();

  const [rows, setRows] = useState<EditorRow[]>([]);
  const [previewData, setPreviewData] = useState<PreviewCostResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Map of active ingredients for quick lookup
  const ingredientMap = useMemo(() => {
    return new Map(ingredients.map((ing) => [ing.id, ing]));
  }, [ingredients]);

  const isInitializedRef = useRef(false);

  // Initialize rows from menuDetail when loaded or opened
  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      return;
    }

    if (isInitializedRef.current) return;

    if (menuDetail?.recipeItems && menuDetail.recipeItems.length > 0) {
      setRows(
        menuDetail.recipeItems.map((r, idx) => ({
          rowId: `row-${idx}-${r.ingredientId}`,
          ingredientId: r.ingredientId,
          qtyUsable: String(Number(r.qtyUsableBase)),
          unitName: r.baseUnit,
        }))
      );
      isInitializedRef.current = true;
    } else if (ingredients.length > 0) {
      const firstIng = ingredients[0];
      if (firstIng) {
        setRows([
          {
            rowId: `row-0-${Date.now()}`,
            ingredientId: firstIng.id,
            qtyUsable: "1",
            unitName: firstIng.baseUnit,
          },
        ]);
      }
      isInitializedRef.current = true;
    }
  }, [menuDetail, isOpen, ingredients]);

  // Debounced costing preview (300 ms, BR-REC-01 / ADR-3)
  useEffect(() => {
    if (!isOpen) return;

    const validItems: RecipeItemInput[] = [];
    for (const row of rows) {
      const qtyNum = Number(row.qtyUsable);
      if (row.ingredientId && !isNaN(qtyNum) && qtyNum > 0) {
        validItems.push({
          ingredientId: row.ingredientId,
          qtyUsable: qtyNum,
          unitName: row.unitName || undefined,
        });
      }
    }

    if (validItems.length === 0) {
      setPreviewData(null);
      return;
    }

    // Check duplicate ingredients in current draft
    const ids = validItems.map((i) => i.ingredientId);
    const hasDuplicates = new Set(ids).size !== ids.length;
    if (hasDuplicates) {
      setFormError("Terdapat bahan baku yang sama berulang kali. Silakan gabungkan takarannya.");
      return;
    } else {
      setFormError(null);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsPreviewLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const preview = await previewCostMutation.mutateAsync({
          menuId: menu.id,
          sellingPrice: menu.sellingPrice,
          targetMargin: menu.targetMargin,
          items: validItems,
        });
        setPreviewData(preview);
      } catch (err) {
        // Silently capture preview error in UI
        if (err instanceof Error) {
          setFormError(err.message);
        }
      } finally {
        setIsPreviewLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [rows, menu.id, menu.sellingPrice, menu.targetMargin, isOpen, previewCostMutation]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    if (rows.length >= 30) {
      toast.error("Maksimal 30 bahan dalam satu resep");
      return;
    }

    // Find first ingredient not already added
    const existingIds = new Set(rows.map((r) => r.ingredientId));
    const available = ingredients.find((i) => !existingIds.has(i.id)) || ingredients[0];

    if (!available) return;

    setRows((prev) => [
      ...prev,
      {
        rowId: `row-${Date.now()}-${Math.random()}`,
        ingredientId: available.id,
        qtyUsable: "1",
        unitName: available.baseUnit,
      },
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) {
      toast.error("Resep minimal harus memiliki 1 bahan baku");
      return;
    }
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const handleRowChange = (
    rowId: string,
    field: "ingredientId" | "qtyUsable" | "unitName",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;

        if (field === "ingredientId") {
          const ing = ingredientMap.get(value);
          return {
            ...r,
            ingredientId: value,
            unitName: ing ? ing.baseUnit : r.unitName,
          };
        }

        return { ...r, [field]: value };
      })
    );
  };

  const handleSave = async () => {
    setFormError(null);

    if (rows.length === 0) {
      setFormError("Resep minimal harus memiliki 1 bahan");
      return;
    }

    const validItems: RecipeItemInput[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!;
      const qtyNum = Number(r.qtyUsable);
      if (!r.ingredientId) {
        setFormError(`Baris ${i + 1}: Bahan baku belum dipilih`);
        return;
      }
      if (isNaN(qtyNum) || qtyNum <= 0) {
        setFormError(`Baris ${i + 1}: Jumlah takaran harus lebih dari 0`);
        return;
      }
      validItems.push({
        ingredientId: r.ingredientId,
        qtyUsable: qtyNum,
        unitName: r.unitName || undefined,
      });
    }

    // Check duplicates
    const ids = validItems.map((i) => i.ingredientId);
    if (new Set(ids).size !== ids.length) {
      setFormError("Terdapat bahan baku duplikat. Gabungkan takarannya.");
      return;
    }

    try {
      await saveRecipeMutation.mutateAsync({
        menuId: menu.id,
        payload: { items: validItems },
      });
      toast.success(`Resep untuk menu "${menu.name}" berhasil disimpan`);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Gagal menyimpan resep menu");
      }
    }
  };

  // Build subtotal map from previewData items
  const subtotalMap = new Map<string, string>();
  if (previewData?.items) {
    for (const item of previewData.items) {
      if (item.subtotal) {
        subtotalMap.set(item.ingredientId, item.subtotal);
      }
    }
  }

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
            disabled={saveRecipeMutation.isPending}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Two Columns on large screens */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Recipe Line Items (7 cols) */}
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
                  className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl"
                >
                  + Tambah Bahan Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {rows.map((row, index) => {
                  const selectedIng = ingredientMap.get(row.ingredientId);
                  const subtotal = subtotalMap.get(row.ingredientId);

                  // Collect available units for this ingredient
                  const availableUnits: string[] = [];
                  if (selectedIng) {
                    availableUnits.push(selectedIng.baseUnit);
                    selectedIng.units.forEach((u) => {
                      if (!availableUnits.includes(u.name)) {
                        availableUnits.push(u.name);
                      }
                    });
                  }

                  return (
                    <div
                      key={row.rowId}
                      className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2 group hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-400 shrink-0">
                          #{index + 1}
                        </span>
                        {/* Ingredient Select */}
                        <div className="flex-1 min-w-0">
                          <select
                            value={row.ingredientId}
                            onChange={(e) =>
                              handleRowChange(row.rowId, "ingredientId", e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                          >
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} ({ing.baseUnit}) - Yield{" "}
                                {Math.round(Number(ing.yieldPercent))}%
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Delete Row Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.rowId)}
                          disabled={rows.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                          title="Hapus baris bahan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        {/* Qty usable input */}
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Takaran Resep
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0.001"
                              step="any"
                              value={row.qtyUsable}
                              onChange={(e) =>
                                handleRowChange(row.rowId, "qtyUsable", e.target.value)
                              }
                              placeholder="0"
                              className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all tabular-nums text-slate-900"
                            />
                            {/* Unit selector */}
                            <select
                              value={row.unitName}
                              onChange={(e) =>
                                handleRowChange(row.rowId, "unitName", e.target.value)
                              }
                              className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 shrink-0"
                            >
                              {availableUnits.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Estimated Subtotal Cost */}
                        <div className="w-32 text-right">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Subtotal Biaya
                          </span>
                          <span className="text-xs font-bold text-slate-800 tabular-nums">
                            {subtotal ? formatRupiah(subtotal) : "Rp-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Live Costing & Margin Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                    Live Costing Preview
                  </span>
                </div>
                {isPreviewLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                )}
              </div>

              {/* Status Badge */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Status Margin Penjualan
                </span>
                {previewData?.marginStatus === "AMAN" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aman (Target Tercapai)
                  </div>
                )}
                {previewData?.marginStatus === "WASPADA" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Waspada (Mendekati Batas)
                  </div>
                )}
                {previewData?.marginStatus === "BAHAYA" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Bahaya (Di Bawah Target)
                  </div>
                )}
                {(!previewData || previewData.marginStatus === "INCOMPLETE") && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    Harga Bahan Belum Lengkap
                  </div>
                )}
              </div>

              {/* Breakdown Metric Rows */}
              <div className="space-y-2.5 text-xs pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between text-slate-300">
                  <span>HPP Bahan Baku</span>
                  <span className="font-bold text-white tabular-nums">
                    {previewData?.hppBahan ? formatRupiah(previewData.hppBahan) : "Belum lengkap"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1">
                    Beban Overhead/porsi
                    <span className="text-[10px] text-slate-500">(alokasi)</span>
                  </span>
                  <span className="font-bold text-white tabular-nums">
                    {previewData ? formatRupiah(previewData.overheadPerPortion) : "Rp0"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-200 pt-1 border-t border-slate-800/80 font-bold">
                  <span>Total HPP Penuh</span>
                  <span className="text-sm font-black text-emerald-400 tabular-nums">
                    {previewData?.hppPenuh ? formatRupiah(previewData.hppPenuh) : "Belum lengkap"}
                  </span>
                </div>
              </div>

              {/* Margin Comparison */}
              <div className="p-3 bg-slate-800/80 rounded-xl space-y-2 border border-slate-700/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Harga Jual Menu</span>
                  <span className="font-bold text-white tabular-nums">
                    {formatRupiah(menu.sellingPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Margin Kontribusi (Rp)</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {previewData?.marginKontribusi
                      ? formatRupiah(previewData.marginKontribusi)
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Margin Penuh (%)</span>
                  <span className="font-black text-white tabular-nums">
                    {previewData?.marginPercent ? formatPercent(previewData.marginPercent) : "-"}
                  </span>
                </div>
              </div>

              {!previewData?.isCostComplete && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Harga Beli Belum Tercatat
                  </p>
                  <p className="text-amber-300/80 leading-relaxed">
                    Satu atau lebih bahan belum pernah dibeli dalam nota belanja. HPP final akan
                    terhitung otomatis begitu ada pembelian bahan tersebut.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saveRecipeMutation.isPending}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveRecipeMutation.isPending || rows.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs shadow-emerald-700/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {saveRecipeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan Resep Menu
          </button>
        </div>
      </div>
    </div>
  );
}
