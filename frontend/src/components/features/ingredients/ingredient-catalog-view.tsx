import { Package, AlertCircle, RefreshCw, Plus } from "lucide-react";
import type { Ingredient } from "@/api/hooks/use-ingredients";
import { IngredientFilters } from "./ingredient-filters";
import { IngredientTable } from "./ingredient-table";

interface IngredientCatalogViewProps {
  ingredients: Ingredient[];
  filtered: Ingredient[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryChange: (val: string) => void;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onStatusChange: (val: "ALL" | "ACTIVE" | "INACTIVE") => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  onOpenPurchase: () => void;
  onOpenCreateIngredient: () => void;
  onEdit: (item: Ingredient) => void;
  onManageUnits: (item: Ingredient) => void;
  onDeactivate: (item: Ingredient) => void;
}

export function IngredientCatalogView({
  filtered,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  isPending,
  isError,
  error,
  refetch,
  onOpenCreateIngredient,
  onEdit,
  onManageUnits,
  onDeactivate,
}: IngredientCatalogViewProps) {
  return (
    <div className="space-y-4">
      <IngredientFilters
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        categoryFilter={categoryFilter}
        onCategoryChange={onCategoryChange}
        statusFilter={statusFilter}
        onStatusChange={onStatusChange}
      />

      {isPending ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Memuat katalog bahan baku...</p>
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">
            {error instanceof Error ? error.message : "Gagal memuat bahan"}
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs font-semibold text-rose-700 underline hover:text-rose-800 cursor-pointer"
          >
            Coba lagi
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-700">Tidak ada bahan baku ditemukan</p>
            <p className="text-xs text-slate-400">
              {searchTerm || categoryFilter !== "ALL" || statusFilter !== "ALL"
                ? "Coba ubah kata kunci atau filter pencarian."
                : "Mulai dengan menambahkan bahan baku pertama Anda."}
            </p>
          </div>
          {!searchTerm && categoryFilter === "ALL" && statusFilter === "ALL" && (
            <button
              type="button"
              onClick={onOpenCreateIngredient}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Bahan Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <IngredientTable
          ingredients={filtered}
          onEdit={onEdit}
          onManageUnits={onManageUnits}
          onDeactivate={onDeactivate}
        />
      )}
    </div>
  );
}
