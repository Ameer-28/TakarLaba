import { useState, useMemo } from "react";
import { Plus, Receipt, Layers, Trash2, Boxes, AlertTriangle } from "lucide-react";
import { useIngredients } from "@/api/hooks/use-ingredients";
import { PurchaseHistory } from "@/components/features/purchase-history";
import { InventorySummary } from "@/components/features/inventory-summary";
import { WasteHistoryList } from "@/components/features/inventory/waste-history-list";
import { WasteRecordModal } from "@/components/features/inventory/waste-record-modal";
import { WasteRadarPanel } from "@/components/features/inventory/waste-radar-panel";
import { useSession } from "@/lib/auth-client";
import {
  IngredientCatalogView,
  IngredientModals,
  useIngredientActions,
} from "@/components/features/ingredients";

export function IngredientsPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role !== "CASHIER";

  const [activeTab, setActiveTab] = useState<"catalog" | "stock" | "history" | "waste" | "radar">(
    "catalog"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);

  const { data: ingredients = [], isPending, isError, error, refetch } = useIngredients();
  const actions = useIngredientActions();

  const filtered = useMemo(() => {
    return ingredients.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === "ALL" || item.category === categoryFilter;
      const matchStatus =
        statusFilter === "ALL" ? true : statusFilter === "ACTIVE" ? item.isActive : !item.isActive;
      return matchSearch && matchCat && matchStatus;
    });
  }, [ingredients, searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Katalog Bahan & Stok
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau ketersediaan batch FEFO, kelola konversi satuan, dan catat nota belanja.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setIsWasteModalOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Catat Terbuang</span>
            </button>
          )}
          <button
            onClick={() => actions.setIsPurchaseModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>Catat Nota Belanja</span>
          </button>
          <button
            onClick={() => actions.setIsCreateOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap ${
            activeTab === "catalog"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Katalog Bahan ({ingredients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap ${
            activeTab === "stock"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Stok &amp; FEFO</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap ${
            activeTab === "history"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Riwayat Nota Belanja</span>
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab("waste")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === "waste"
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Bahan Terbuang (Waste)</span>
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => setActiveTab("radar")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === "radar"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Waste Radar</span>
          </button>
        )}
      </div>

      {activeTab === "radar" ? (
        <WasteRadarPanel />
      ) : activeTab === "history" ? (
        <PurchaseHistory onOpenCreate={() => actions.setIsCreateOpen(true)} />
      ) : activeTab === "stock" ? (
        <InventorySummary
          isOwner={isOwner}
          onOpenPurchase={() => actions.setIsPurchaseModalOpen(true)}
          onOpenCreateIngredient={() => actions.setIsCreateOpen(true)}
        />
      ) : activeTab === "waste" ? (
        <WasteHistoryList onOpenRecordModal={() => setIsWasteModalOpen(true)} />
      ) : (
        <IngredientCatalogView
          ingredients={ingredients}
          filtered={filtered}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          isPending={isPending}
          isError={isError}
          error={error}
          refetch={refetch}
          onOpenPurchase={() => actions.setIsPurchaseModalOpen(true)}
          onOpenCreateIngredient={() => actions.setIsCreateOpen(true)}
          onEdit={actions.setEditingIngredient}
          onManageUnits={actions.setManagingUnitsIngredient}
          onDeactivate={actions.setDeactivatingIngredient}
        />
      )}

      <IngredientModals
        ingredients={ingredients}
        isCreateOpen={actions.isCreateOpen}
        onCloseCreate={() => actions.setIsCreateOpen(false)}
        onCreateSubmit={actions.handleCreate}
        isCreating={actions.isCreating}
        editingIngredient={actions.editingIngredient}
        onCloseEdit={() => actions.setEditingIngredient(null)}
        onEditSubmit={actions.handleUpdate}
        isUpdating={actions.isUpdating}
        managingUnitsIngredient={actions.managingUnitsIngredient}
        onCloseUnits={() => actions.setManagingUnitsIngredient(null)}
        onAddUnit={actions.handleAddUnit}
        onDeleteUnit={actions.handleDeleteUnit}
        isAddingUnit={actions.isAddingUnit}
        deactivatingIngredient={actions.deactivatingIngredient}
        onCloseDeactivate={() => actions.setDeactivatingIngredient(null)}
        onConfirmDeactivate={actions.handleDeactivate}
        isDeactivating={actions.isDeactivating}
        isPurchaseModalOpen={actions.isPurchaseModalOpen}
        onClosePurchaseModal={() => actions.setIsPurchaseModalOpen(false)}
        onPurchaseSuccess={() => refetch()}
      />

      <WasteRecordModal
        isOpen={isWasteModalOpen}
        onClose={() => setIsWasteModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default IngredientsPage;
