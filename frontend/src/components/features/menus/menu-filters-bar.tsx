import {
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  BookOpen,
  Coffee,
  Utensils,
  CupSoda,
  LayoutGrid,
  Tag,
  Layers,
  SlidersHorizontal,
  ToggleRight,
  ToggleLeft,
  RotateCcw,
} from "lucide-react";
import { DropdownNavigation, type NavItem } from "@/components/ui/dropdown-navigation";

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
  const hasActiveFilters =
    Boolean(search) ||
    selectedCategory !== "ALL" ||
    activeFilter !== "ALL" ||
    marginFilter !== "ALL";

  const handleResetFilters = () => {
    onSearchChange("");
    onSelectCategory("ALL");
    onActiveFilterChange("ALL");
    onMarginFilterChange("ALL");
  };

  const navItems: NavItem[] = [
    {
      id: "kategori",
      label: selectedCategory === "ALL" ? "Kategori" : `Kategori: ${selectedCategory}`,
      active: selectedCategory !== "ALL",
      subMenus: [
        {
          title: "Pilihan Kategori Menu",
          items: [
            {
              label: "Semua Kategori",
              description: "Tampilkan seluruh menu makanan dan minuman",
              icon: LayoutGrid,
              active: selectedCategory === "ALL",
              onClick: () => onSelectCategory("ALL"),
            },
            ...availableCategories.map((cat) => {
              let Icon = Tag;
              let desc = `Daftar menu untuk kategori ${cat}`;
              const lower = cat.toLowerCase();
              if (lower.includes("kopi") && !lower.includes("non")) {
                Icon = Coffee;
                desc = "Minuman olahan espresso, latte, & racikan kopi";
              } else if (
                lower.includes("makan") ||
                lower.includes("food") ||
                lower.includes("snack") ||
                lower.includes("roti") ||
                lower.includes("pastry")
              ) {
                Icon = Utensils;
                desc = "Makanan berat, camilan, & hidangan penutup";
              } else if (
                lower.includes("non") ||
                lower.includes("teh") ||
                lower.includes("drink") ||
                lower.includes("minum") ||
                lower.includes("juice") ||
                lower.includes("jus")
              ) {
                Icon = CupSoda;
                desc = "Aneka teh, cokelat, susu, & minuman segar";
              }
              return {
                label: cat,
                description: desc,
                icon: Icon,
                active: selectedCategory === cat,
                onClick: () => onSelectCategory(cat),
              };
            }),
          ],
        },
      ],
    },
    {
      id: "margin",
      label:
        marginFilter === "ALL"
          ? "Status Margin"
          : marginFilter === "AMAN"
            ? "Margin: Aman"
            : marginFilter === "WASPADA"
              ? "Margin: Waspada"
              : marginFilter === "BAHAYA"
                ? "Margin: Bahaya"
                : "Margin: Perlu Resep",
      active: marginFilter !== "ALL",
      subMenus: [
        {
          title: "Kesehatan Margin & HPP",
          items: [
            {
              label: "Semua Margin",
              description: "Tampilkan seluruh status kesehatan keuntungan menu",
              icon: Layers,
              active: marginFilter === "ALL",
              onClick: () => onMarginFilterChange("ALL"),
            },
            {
              label: "Aman",
              description: "Margin laba sehat di atas batas target keuntungan",
              icon: CheckCircle2,
              active: marginFilter === "AMAN",
              onClick: () => onMarginFilterChange("AMAN"),
            },
            {
              label: "Waspada",
              description: "Margin tipis mendekati batas kritis modal HPP bahan",
              icon: AlertTriangle,
              active: marginFilter === "WASPADA",
              onClick: () => onMarginFilterChange("WASPADA"),
            },
            {
              label: "Bahaya",
              description: "Margin sangat rendah atau rugi di bawah modal pokok",
              icon: AlertCircle,
              active: marginFilter === "BAHAYA",
              onClick: () => onMarginFilterChange("BAHAYA"),
            },
            {
              label: "Perlu Resep / Belum Lengkap",
              description: "Menu belum diisi resep bahan baku atau racikan kosong",
              icon: BookOpen,
              active: marginFilter === "INCOMPLETE_OR_NO_RECIPE",
              onClick: () => onMarginFilterChange("INCOMPLETE_OR_NO_RECIPE"),
            },
          ],
        },
      ],
    },
    {
      id: "status",
      label:
        activeFilter === "ALL"
          ? "Semua Status"
          : activeFilter === "ACTIVE"
            ? "Hanya Aktif"
            : "Hanya Nonaktif",
      active: activeFilter !== "ALL",
      subMenus: [
        {
          title: "Ketersediaan Menu",
          items: [
            {
              label: "Semua Status",
              description: "Tampilkan seluruh menu baik yang aktif maupun nonaktif",
              icon: SlidersHorizontal,
              active: activeFilter === "ALL",
              onClick: () => onActiveFilterChange("ALL"),
            },
            {
              label: "Hanya Aktif",
              description: "Menu aktif yang siap dijual di kasir POS",
              icon: ToggleRight,
              active: activeFilter === "ACTIVE",
              onClick: () => onActiveFilterChange("ACTIVE"),
            },
            {
              label: "Hanya Nonaktif",
              description: "Menu yang sedang dinonaktifkan atau diarsipkan",
              icon: ToggleLeft,
              active: activeFilter === "INACTIVE",
              onClick: () => onActiveFilterChange("INACTIVE"),
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search bar */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama menu atau kategori..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#253745]/20 focus:border-[#253745] transition-all placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              title="Hapus pencarian"
            >
              &times;
            </button>
          )}
        </div>

        {/* Navigation Dropdown & Standalone Create Menu Button */}
        <div className="flex flex-wrap items-center gap-2">
          <DropdownNavigation navItems={navItems} />

          {/* Standalone Direct Action: Tambah Menu */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#11212D] hover:bg-[#253745] active:bg-[#06141B] rounded-full shadow-xs transition-all duration-200 cursor-pointer active:scale-95 shrink-0 select-none"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tambah Menu</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-full transition-all cursor-pointer"
              title="Reset semua filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MenuFiltersBar;
