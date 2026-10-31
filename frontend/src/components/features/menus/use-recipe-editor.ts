import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  useMenuDetail,
  useSaveRecipe,
  usePreviewRecipeCost,
  type MenuItem,
  type PreviewCostResponse,
} from "../../../api/hooks/use-menus.js";
import { useIngredients } from "../../../api/hooks/use-ingredients.js";
import type { EditorRow } from "./recipe-row-item.js";
import { validateRecipeRows } from "./recipe-utils.js";

export function useRecipeEditor(menu: MenuItem, isOpen: boolean, onClose: () => void) {
  const { data: menuDetail, isPending: isLoadingDetail } = useMenuDetail(menu.id);
  const { data: ingredients = [] } = useIngredients({ isActive: true });
  const saveRecipeMutation = useSaveRecipe();
  const previewCostMutation = usePreviewRecipeCost();

  const [rows, setRows] = useState<EditorRow[]>([]);
  const [previewData, setPreviewData] = useState<PreviewCostResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const ingredientMap = useMemo(() => {
    return new Map(ingredients.map((ing) => [ing.id, ing]));
  }, [ingredients]);

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

  useEffect(() => {
    if (!isOpen) return;

    const validation = validateRecipeRows(rows);
    if (validation.error) {
      setFormError(validation.error);
      return;
    }
    setFormError(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setIsPreviewLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const preview = await previewCostMutation.mutateAsync({
          menuId: menu.id,
          sellingPrice: menu.sellingPrice,
          targetMargin: menu.targetMargin,
          items: validation.validItems,
        });
        setPreviewData(preview);
      } catch (err) {
        if (err instanceof Error) setFormError(err.message);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [rows, menu.id, menu.sellingPrice, menu.targetMargin, isOpen, previewCostMutation]);

  const handleAddRow = () => {
    if (rows.length >= 30) {
      toast.error("Maksimal 30 bahan dalam satu resep");
      return;
    }
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
    const validation = validateRecipeRows(rows);
    if (validation.error) {
      setFormError(validation.error);
      return;
    }

    try {
      await saveRecipeMutation.mutateAsync({
        menuId: menu.id,
        payload: { items: validation.validItems },
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

  const subtotalMap = new Map<string, string>();
  if (previewData?.items) {
    for (const item of previewData.items) {
      if (item.subtotal) {
        subtotalMap.set(item.ingredientId, item.subtotal);
      }
    }
  }

  return {
    rows,
    ingredients,
    ingredientMap,
    subtotalMap,
    previewData,
    isPreviewLoading,
    isLoadingDetail,
    formError,
    isSaving: saveRecipeMutation.isPending,
    handleAddRow,
    handleRemoveRow,
    handleRowChange,
    handleSave,
  };
}
