import { useState, useMemo } from "react";
import {
  UtensilsCrossed,
  Plus,
  Search,
  BookOpen,
  AlertCircle,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  useMenus,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
  type MenuItem,
} from "../../../api/hooks/use-menus.js";
import { useSettings } from "../../../api/hooks/use-settings.js";
import { formatRupiah } from "../../../lib/format.js";
import { MenuModal } from "./menu-modal.js";
import { MenuDeleteModal } from "./menu-delete-modal.js";
import { RecipeEditorModal } from "./recipe-editor-modal.js";
import { MarginBadge } from "./margin-badge.js";

type MarginFilterType = "ALL" | "AMAN" | "WASPADA" | "BAHAYA" | "INCOMPLETE_OR_NO_RECIPE";

export function MenuManager() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [marginFilter, setMarginFilter] = useState<MarginFilterType>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    menu: MenuItem | null;
  }>({
    isOpen: false,
    menu: null,
  });

  const [recipeModalState, setRecipeModalState] = useState<{
    isOpen: boolean;
    menu: MenuItem | null;
  }>({
    isOpen: false,
    menu: null,
  });

  const { data: menus = [], isPending, isError, refetch } = useMenus();
  const { data: settings } = useSettings();

  const createMutation = useCreateMenu();
  const updateMutation = useUpdateMenu();
  const deleteMutation = useDeleteMenu();

  const defaultBusinessMargin = settings?.targetMarginDefault ?? "50";

  // Categories present in data
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    menus.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [menus]);

  // Metrics calculation across all menus (BR-09 & FR-COST-01)
  const metrics = useMemo(() => {
    const total = menus.length;
    const active = menus.filter((m) => m.isActive).length;
    const safeMargin = menus.filter(
      (m) => m.costSummary && m.costSummary.isCostComplete && m.costSummary.marginStatus === "AMAN"
    ).length;
    const warningOrDanger = menus.filter(
      (m) =>
        m.costSummary &&
        m.costSummary.isCostComplete &&
        (m.costSummary.marginStatus === "WASPADA" || m.costSummary.marginStatus === "BAHAYA")
    ).length;
    const incompleteOrNoRecipe = menus.filter(
      (m) => !m.hasRecipe || !m.costSummary?.isCostComplete
    ).length;

    return { total, active, safeMargin, warningOrDanger, incompleteOrNoRecipe };
  }, [menus]);

  // Filtered menus based on search, category, active status, and margin safety
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = menu.name.toLowerCase().includes(query);
        const matchesCat = menu.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat) return false;
      }

      if (selectedCategory !== "ALL") {
        if (selectedCategory === "UNCATEGORIZED") {
          if (menu.category) return false;
        } else if (menu.category !== selectedCategory) {
          return false;
        }
      }

      if (activeFilter === "ACTIVE" && !menu.isActive) return false;
      if (activeFilter === "INACTIVE" && menu.isActive) return false;

      if (marginFilter !== "ALL") {
        if (marginFilter === "INCOMPLETE_OR_NO_RECIPE") {
          if (menu.hasRecipe && menu.costSummary?.isCostComplete) return false;
        } else {
          if (!menu.costSummary || !menu.costSummary.isCostComplete) return false;
          if (menu.costSummary.marginStatus !== marginFilter) return false;
        }
      }

      return true;
    });
  }, [menus, search, selectedCategory, activeFilter, marginFilter]);

  const handleOpenCreate = () => {
    setEditingMenu(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (menu: MenuItem) => {
    setEditingMenu(menu);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: {
    name: string;
    category?: string | null;
    sellingPrice: number;
    targetMargin?: number | null;
    isActive?: boolean;
  }) => {
    if (editingMenu) {
      await updateMutation.mutateAsync({
        id: editingMenu.id,
        payload,
      });
      toast.success(`Menu "${payload.name}" berhasil diperbarui`);
    } else {
      await createMutation.mutateAsync(payload);
      toast.success(`Menu "${payload.name}" berhasil ditambahkan`);
    }
  };

  const handleToggleActive = async (menu: MenuItem) => {
    try {
      await updateMutation.mutateAsync({
        id: menu.id,
        payload: { isActive: !menu.isActive },
      });
      toast.success(
        `Status menu "${menu.name}" diubah menjadi ${!menu.isActive ? "Aktif" : "Nonaktif"}`
      );
    } catch {
      toast.error(`Gagal mengubah status menu "${menu.name}"`);
    }
  };

  const handleOpenDelete = (menu: MenuItem) => {
    setDeleteModalState({
      isOpen: true,
      menu,
    });
  };

  const handleOpenRecipe = (menu: MenuItem) => {
    setRecipeModalState({
      isOpen: true,
      menu,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalState.menu) return;
    try {
      await deleteMutation.mutateAsync(deleteModalState.menu.id);
      toast.success(`Menu "${deleteModalState.menu.name}" berhasil dihapus`);
      setDeleteModalState({ isOpen: false, menu: null });
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Gagal menghapus menu");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Header Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Menu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Menu
            </span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 tabular-nums">{metrics.total}</p>
          <span className="text-xs text-slate-500 mt-1 block">
            {metrics.active} menu aktif dijual
          </span>
        </div>

        {/* Margin Aman */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Margin Aman
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2 tabular-nums">
            {metrics.safeMargin}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Memenuhi target margin usaha</span>
        </div>

        {/* Margin Perlu Perhatian */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Perlu Perhatian
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2 tabular-nums">
            {metrics.warningOrDanger}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Status Waspada atau Bahaya</span>
        </div>

        {/* Perlu Resep / Belum Lengkap */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Perlu Data
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-700 mt-2 tabular-nums">
            {metrics.incompleteOrNoRecipe}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Belum ada resep atau nota beli</span>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama menu atau kategori..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Hanya Aktif</option>
              <option value="INACTIVE">Hanya Nonaktif</option>
            </select>

            {/* Add Menu Button */}
            <button
              type="button"
              onClick={handleOpenCreate}
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
              onClick={() => setSelectedCategory("ALL")}
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
                onClick={() => setSelectedCategory(cat)}
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
              onClick={() => setMarginFilter("ALL")}
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
              onClick={() => setMarginFilter("AMAN")}
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
              onClick={() => setMarginFilter("WASPADA")}
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
              onClick={() => setMarginFilter("BAHAYA")}
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
              onClick={() => setMarginFilter("INCOMPLETE_OR_NO_RECIPE")}
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

      {/* Menu Catalog Presentation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isPending ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Memuat katalog menu & kalkulasi margin...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-rose-700">Gagal memuat katalog menu usaha</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {search ||
              selectedCategory !== "ALL" ||
              activeFilter !== "ALL" ||
              marginFilter !== "ALL"
                ? "Tidak Ada Menu yang Cocok"
                : "Belum Ada Menu Terdaftar"}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {search ||
              selectedCategory !== "ALL" ||
              activeFilter !== "ALL" ||
              marginFilter !== "ALL"
                ? "Coba sesuaikan kata kunci pencarian, filter kategori, atau filter status margin Anda."
                : "Mulai daftarkan menu makanan atau minuman Anda untuk menghitung HPP Bahan, HPP Penuh, dan menentukan harga jual yang sehat."}
            </p>
            {!search &&
              selectedCategory === "ALL" &&
              activeFilter === "ALL" &&
              marginFilter === "ALL" && (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-xs shadow-emerald-700/20"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Menu Pertama
                </button>
              )}
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table (md & up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Menu & Kategori</th>
                    <th className="py-3 px-4">Harga Jual</th>
                    <th className="py-3 px-4">HPP Bahan vs Penuh</th>
                    <th className="py-3 px-4">Margin Kontribusi</th>
                    <th className="py-3 px-4">Status Margin</th>
                    <th className="py-3 px-4">Resep</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMenus.map((menu) => {
                    const cost = menu.costSummary;
                    const isCostReady = menu.hasRecipe && cost?.isCostComplete;

                    return (
                      <tr key={menu.id} className="hover:bg-slate-50/60 transition-colors group">
                        {/* Menu Name & Category */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0 border border-emerald-100 text-sm">
                              {menu.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {menu.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {menu.category ? (
                                  <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-md">
                                    {menu.category}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Tanpa kategori</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Harga Jual */}
                        <td className="py-3.5 px-4 tabular-nums font-bold text-slate-900">
                          {formatRupiah(menu.sellingPrice)}
                        </td>

                        {/* HPP Bahan vs HPP Penuh (BR-04, FR-COST-01) */}
                        <td className="py-3.5 px-4 tabular-nums">
                          {isCostReady && cost.hppBahan && cost.hppPenuh ? (
                            <div>
                              <div className="font-semibold text-slate-800">
                                {formatRupiah(cost.hppBahan)}
                                <span className="text-slate-400 font-normal text-xs ml-1">
                                  (Bahan)
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 font-medium mt-0.5">
                                {formatRupiah(cost.hppPenuh)}
                                <span className="text-[11px] text-slate-400 ml-1">
                                  (+{formatRupiah(cost.overheadPerPortion)} ovh)
                                </span>
                              </div>
                            </div>
                          ) : menu.hasRecipe ? (
                            <span className="text-xs text-amber-700 font-medium">
                              Belum lengkap
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">-</span>
                          )}
                        </td>

                        {/* Margin Kontribusi (Rp & %) */}
                        <td className="py-3.5 px-4 tabular-nums">
                          {isCostReady && cost.marginKontribusi && cost.marginPercent ? (
                            <div>
                              <div className="font-bold text-slate-900">
                                {formatRupiah(cost.marginKontribusi)}
                              </div>
                              <div className="text-xs text-slate-500 font-medium mt-0.5">
                                Target: {menu.targetMargin ?? defaultBusinessMargin}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">-</span>
                          )}
                        </td>

                        {/* Status Margin Badge (BR-09) */}
                        <td className="py-3.5 px-4">
                          <MarginBadge
                            costSummary={menu.costSummary}
                            hasRecipe={menu.hasRecipe}
                            targetMargin={menu.targetMargin}
                            defaultBusinessMargin={defaultBusinessMargin}
                          />
                        </td>

                        {/* Status Resep Button */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleOpenRecipe(menu)}
                            className="group/badge cursor-pointer text-left"
                            title="Klik untuk melihat atau mengatur resep"
                          >
                            {menu.hasRecipe ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200/60 rounded-lg group-hover/badge:bg-sky-100 transition-colors">
                                <BookOpen className="w-3.5 h-3.5" />
                                {menu.recipeItemsCount} Bahan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg group-hover/badge:bg-amber-100 transition-colors">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Belum Ada Resep
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Status Aktif Switch */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(menu)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                              menu.isActive
                                ? "bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                            title="Klik untuk mengubah status aktif"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                menu.isActive ? "bg-emerald-600" : "bg-slate-400"
                              }`}
                            />
                            {menu.isActive ? "Aktif" : "Nonaktif"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenRecipe(menu)}
                              className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title="Atur takaran resep & costing"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(menu)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Ubah rincian menu"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(menu)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus menu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md: 360px+) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredMenus.map((menu) => {
                const cost = menu.costSummary;
                const isCostReady = menu.hasRecipe && cost?.isCostComplete;

                return (
                  <div key={menu.id} className="p-4 space-y-3">
                    {/* Header: Title, Category, Active Toggle */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{menu.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {menu.category ? (
                            <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-md">
                              {menu.category}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Tanpa kategori</span>
                          )}
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500 tabular-nums font-semibold">
                            Target {menu.targetMargin ?? defaultBusinessMargin}%
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(menu)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer shrink-0 ${
                          menu.isActive
                            ? "bg-emerald-100/80 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            menu.isActive ? "bg-emerald-600" : "bg-slate-400"
                          }`}
                        />
                        {menu.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                    </div>

                    {/* Price and Costing Grid */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Harga Jual</span>
                        <span className="font-bold text-slate-900 text-sm tabular-nums">
                          {formatRupiah(menu.sellingPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Margin Kontribusi</span>
                        <span className="font-bold text-slate-900 text-sm tabular-nums">
                          {isCostReady && cost.marginKontribusi
                            ? formatRupiah(cost.marginKontribusi)
                            : "-"}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-slate-200/60">
                        <span className="text-slate-400 block font-medium">HPP Bahan</span>
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {isCostReady && cost.hppBahan ? formatRupiah(cost.hppBahan) : "-"}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-slate-200/60">
                        <span className="text-slate-400 block font-medium">HPP Penuh (+Ovh)</span>
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {isCostReady && cost.hppPenuh ? formatRupiah(cost.hppPenuh) : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Margin Safety Badge */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <MarginBadge
                        costSummary={menu.costSummary}
                        hasRecipe={menu.hasRecipe}
                        targetMargin={menu.targetMargin}
                        defaultBusinessMargin={defaultBusinessMargin}
                      />

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenRecipe(menu)}
                          className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Resep</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(menu)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Ubah rincian menu"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(menu)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus menu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Information Tip & Guidance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 space-y-1">
            <p className="font-bold">HPP Bahan vs HPP Penuh (BR-04)</p>
            <p className="text-emerald-900 leading-relaxed">
              <strong>HPP Bahan</strong> menghitung total biaya bahan baku berdasarkan nota
              pembelian terbaru (replacement cost). <strong>HPP Penuh</strong> menambahkan alokasi
              beban overhead per porsi agar laba bersih usaha Anda terlindungi dari biaya sewa,
              listrik, dan gaji.
            </p>
          </div>
        </div>

        <div className="bg-sky-50/70 border border-sky-200/70 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-950 space-y-1">
            <p className="font-bold">Standar Keamanan Margin (BR-09)</p>
            <p className="text-sky-900 leading-relaxed">
              Status <span className="font-semibold text-emerald-700">Aman</span> jika margin
              memenuhi target usaha. Status{" "}
              <span className="font-semibold text-amber-700">Waspada</span> jika turun dalam rentang
              5 pp di bawah target. Status{" "}
              <span className="font-semibold text-rose-700">Bahaya</span> jika turun lebih dari 5 pp
              di bawah target.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingMenu}
        isSaving={createMutation.isPending || updateMutation.isPending}
        defaultBusinessMargin={defaultBusinessMargin}
      />

      <MenuDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, menu: null })}
        onConfirm={handleConfirmDelete}
        menuName={deleteModalState.menu?.name ?? ""}
        isDeleting={deleteMutation.isPending}
        hasSales={(deleteModalState.menu?.saleItemsCount ?? 0) > 0}
      />

      {recipeModalState.menu && (
        <RecipeEditorModal
          isOpen={recipeModalState.isOpen}
          onClose={() => setRecipeModalState({ isOpen: false, menu: null })}
          menu={recipeModalState.menu}
        />
      )}
    </div>
  );
}
