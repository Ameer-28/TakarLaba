import { UtensilsCrossed, Plus, AlertCircle } from "lucide-react";
import { MenuModal } from "./menu-modal.js";
import { MenuDeleteModal } from "./menu-delete-modal.js";
import { RecipeEditorModal } from "./recipe-editor-modal.js";
import { MenuKpiCards } from "./menu-kpi-cards.js";
import { MenuFiltersBar } from "./menu-filters-bar.js";
import { MenuTable } from "./menu-table.js";
import { MenuInfoBanners } from "./menu-info-banners.js";
import { useMenuManager } from "./use-menu-manager.js";

export function MenuManager() {
  const {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    activeFilter,
    setActiveFilter,
    marginFilter,
    setMarginFilter,
    isModalOpen,
    setIsModalOpen,
    editingMenu,
    deleteModalState,
    setDeleteModalState,
    recipeModalState,
    setRecipeModalState,
    filteredMenus,
    availableCategories,
    metrics,
    defaultBusinessMargin,
    isPending,
    isError,
    refetch,
    isSaving,
    isDeleting,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    handleToggleActive,
    handleConfirmDelete,
  } = useMenuManager();

  return (
    <div className="space-y-6">
      <MenuKpiCards metrics={metrics} />

      <MenuFiltersBar
        search={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        availableCategories={availableCategories}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        marginFilter={marginFilter}
        onMarginFilterChange={setMarginFilter}
        onOpenCreate={handleOpenCreate}
      />

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
          <MenuTable
            menus={filteredMenus}
            defaultBusinessMargin={defaultBusinessMargin}
            onOpenRecipe={(menu) => setRecipeModalState({ isOpen: true, menu })}
            onOpenEdit={handleOpenEdit}
            onOpenDelete={(menu) => setDeleteModalState({ isOpen: true, menu })}
            onToggleActive={handleToggleActive}
          />
        )}
      </div>

      <MenuInfoBanners />

      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingMenu}
        isSaving={isSaving}
        defaultBusinessMargin={defaultBusinessMargin}
      />

      <MenuDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, menu: null })}
        onConfirm={handleConfirmDelete}
        menuName={deleteModalState.menu?.name ?? ""}
        isDeleting={isDeleting}
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
