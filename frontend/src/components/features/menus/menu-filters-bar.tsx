import { Search, Plus, CheckCircle2, AlertTriangle, AlertCircle, BookOpen } from "lucide-react";

export type MarginFilterType = "ALL" | "AMAN" | "WASPADA" | "BAHAYA" | "INCOMPLETE_OR_NO_RECIPE";

interface MenuFiltersBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  availableCategories: string[];
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onActiveFilterChange: (filter: "ALL" | "ACTIVE" | "INACTIVE") => void;
  marginFilter: MarginFilterType;
  onMarginFilterChange: (margin: MarginFilterType) => void;
  onOpenCreate: () => void;
}

export function MenuFiltersBar({
  search,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  availableCategories,
  activeFilter,
  onActiveFilterChange,
  marginFilter,
  onMarginFilterChange,
  onOpenCreate,
}: MenuFiltersBarProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama menu atau kategori..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={activeFilter}
            onChange={(e) => onActiveFilterChange(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Hanya Aktif</option>
            <option value="INACTIVE">Hanya Nonaktif</option>
          </select>

          {/* Add Menu Button */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs shadow-emerald-700/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu</span>
          </button>
        </div>
      </div>

      {/* Filter Pills: Categories & Margin Safety */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1">Kategori:</span>
          <button
            type="button"
            onClick={() => onSelectCategory("ALL")}
            className={`px-3 py-1 text-xs rounded-lg transition-colors font-semibold cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors font-semibold cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Margin Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-semibold text-slate-400 mr-1">Status Margin:</span>
          <button
            type="button"
            onClick={() => onMarginFilterChange("ALL")}
            className={`px-3 py-1 text-xs rounded-lg transition-colors font-semibold cursor-pointer ${
              marginFilter === "ALL"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Margin
          </button>
          <button
            type="button"
            onClick={() => onMarginFilterChange("AMAN")}
            className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition-colors font-semibold cursor-pointer ${
              marginFilter === "AMAN"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Aman</span>
          </button>
          <button
            type="button"
            onClick={() => onMarginFilterChange("WASPADA")}
            className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition-colors font-semibold cursor-pointer ${
              marginFilter === "WASPADA"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Waspada</span>
          </button>
          <button
            type="button"
            onClick={() => onMarginFilterChange("BAHAYA")}
            className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition-colors font-semibold cursor-pointer ${
              marginFilter === "BAHAYA"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50"
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Bahaya</span>
          </button>
          <button
            type="button"
            onClick={() => onMarginFilterChange("INCOMPLETE_OR_NO_RECIPE")}
            className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition-colors font-semibold cursor-pointer ${
              marginFilter === "INCOMPLETE_OR_NO_RECIPE"
                ? "bg-sky-700 text-white"
                : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/50"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Perlu Resep / Belum Lengkap</span>
          </button>
        </div>
      </div>
    </div>
  );
}
