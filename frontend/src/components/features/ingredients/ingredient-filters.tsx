import { Search, X, Plus } from "lucide-react";
import { CustomSelect, type SelectOption } from "@/components/ui/custom-select";

interface IngredientFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryChange: (val: string) => void;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  onStatusChange: (val: "ALL" | "ACTIVE" | "INACTIVE") => void;
  onOpenCreate?: () => void;
}

const CATEGORY_TABS = [
  { id: "ALL", label: "All Categories" },
  { id: "MAIN", label: "Main Ingredients" },
  { id: "SUPPORT", label: "Supporting" },
  { id: "PACKAGING", label: "Packaging" },
];

const CATEGORY_SELECT_OPTIONS: SelectOption<string>[] = CATEGORY_TABS.map((t) => ({
  value: t.id,
  label: t.label,
}));

const STATUS_SELECT_OPTIONS: SelectOption<"ALL" | "ACTIVE" | "INACTIVE">[] = [
  { value: "ALL", label: "All Status" },
  { value: "ACTIVE", label: "Active Only" },
  { value: "INACTIVE", label: "Inactive Only" },
];

export function IngredientFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  onOpenCreate,
}: IngredientFiltersProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search ingredient name (e.g. Rice, Coffee, Milk)..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition-all bg-slate-50/50"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Tablet & Mobile Category Dropdown (tampilan tablet kebawah) */}
        <div className="lg:hidden w-full sm:w-auto min-w-[160px]">
          <CustomSelect<string>
            value={categoryFilter}
            onChange={onCategoryChange}
            options={CATEGORY_SELECT_OPTIONS}
            triggerClassName="py-1.5 px-3 text-xs"
          />
        </div>

        {/* Desktop Category Tabs */}
        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
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

        {/* Right Controls: Custom Status Filter & Add Ingredient */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="min-w-[125px]">
            <CustomSelect<"ALL" | "ACTIVE" | "INACTIVE">
              value={statusFilter}
              onChange={onStatusChange}
              options={STATUS_SELECT_OPTIONS}
              triggerClassName="py-1.5 px-3 text-xs"
            />
          </div>

          {onOpenCreate && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Add new master ingredient"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ingredient</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
