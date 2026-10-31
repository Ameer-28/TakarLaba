import React, { useState, useEffect } from "react";
import { X, Loader2, DollarSign } from "lucide-react";
import type { OverheadCost, OverheadType } from "./types.js";
import { OVERHEAD_TYPE_LABELS } from "./types.js";

interface OverheadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    type: OverheadType;
    monthlyAmount: number;
    isActive?: boolean;
  }) => Promise<void>;
  initialData?: OverheadCost | null;
  isSaving?: boolean;
}

export function OverheadModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving = false,
}: OverheadModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<OverheadType>("UTILITY");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setMonthlyAmount(Math.round(Number(initialData.monthlyAmount)).toString());
      setIsActive(initialData.isActive);
    } else {
      setName("");
      setType("UTILITY");
      setMonthlyAmount("");
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
      setError("Nama beban overhead minimal 2 karakter");
      return;
    }

    const amountNum = Number(monthlyAmount);
    if (isNaN(amountNum) || amountNum < 0) {
      setError("Nominal bulanan harus berupa angka positif atau 0");
      return;
    }

    try {
      await onSave({
        name: trimmedName,
        type,
        monthlyAmount: amountNum,
        isActive,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal menyimpan beban overhead");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">
              {initialData ? "Ubah Beban Overhead" : "Tambah Beban Overhead"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Biaya / Beban <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Tagihan Listrik PLN & Air PDAM"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori Overhead <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as OverheadType)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {(Object.keys(OVERHEAD_TYPE_LABELS) as OverheadType[]).map((t) => (
                <option key={t} value={t}>
                  {OVERHEAD_TYPE_LABELS[t].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal per Bulan (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                placeholder="500000"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="is-active-overhead"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
            />
            <label
              htmlFor="is-active-overhead"
              className="text-xs font-medium text-slate-700 select-none"
            >
              Status Aktif (dihitung dalam beban overhead per porsi)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialData ? "Simpan Perubahan" : "Tambah Beban"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
