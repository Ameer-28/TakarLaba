import { Search, X } from "lucide-react";

interface IngredientFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryChange: (val: string) => void;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onStatusChange: (val: "ALL" | "ACTIVE" | "INACTIVE") => void;
}

const CATEGORY_TABS = [
  { id: "ALL", label: "Semua Kategori" },
  { id: "MAIN", label: "Bahan Utama" },
  { id: "SUPPORT", label: "Pendukung" },
  { id: "PACKAGING", label: "Kemasan" },
];

export function IngredientFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
}: IngredientFiltersProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
      {/* Search Bar (Baris Atas - Lebar Penuh) */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari nama bahan baku (misal: Beras, Kopi, Susu)..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition-all bg-slate-50/50"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
            title="Hapus pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Controls Row (Baris Bawah - Kategori & Status) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onCategoryChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === tab.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50/60 hover:bg-slate-100/70 focus:outline-hidden focus:border-slate-800 transition-colors cursor-pointer"
          >
            <option value="ACTIVE">Hanya Aktif</option>
            <option value="ALL">Semua Status</option>
            <option value="INACTIVE">Hanya Nonaktif</option>
          </select>
        </div>
      </div>
    </div>
  );
}
