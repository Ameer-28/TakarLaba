import { useState, useEffect } from "react";
import type React from "react";
import type { MenuItem } from "./types.js";

interface UseMenuModalFormParams {
  isOpen: boolean;
  initialData?: MenuItem | null;
  onSave: (payload: {
    name: string;
    category?: string | null;
    sellingPrice: number;
    targetMargin?: number | null;
    isActive?: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export function useMenuModalForm({ isOpen, initialData, onSave, onClose }: UseMenuModalFormParams) {
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

  return {
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
  };
}
