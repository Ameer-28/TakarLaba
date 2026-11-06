import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import {
  Plus,
  Receipt,
  Layers,
  Trash2,
  Boxes,
  AlertTriangle,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import { useIngredients } from "@/api/hooks/use-ingredients";
import { PurchaseHistory } from "@/components/features/purchase-history";
import { InventorySummary } from "@/components/features/inventory-summary";
import { WasteHistoryList } from "@/components/features/inventory/waste-history-list";
import { WasteRecordModal } from "@/components/features/inventory/waste-record-modal";
import { WasteRadarPanel } from "@/components/features/inventory/waste-radar-panel";
import { StockAdjustmentModal } from "@/components/features/inventory/stock-adjustment-modal";
import { AdjustmentHistoryList } from "@/components/features/inventory/adjustment-history-list";
import { useSession } from "@/lib/auth-client";
import { downloadCsv } from "@/lib/export";
import {
  IngredientCatalogView,
  IngredientModals,
  useIngredientActions,
} from "@/components/features/ingredients";

export function IngredientsPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role !== "CASHIER";

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: "catalog" | "stock" | "history" | "waste" | "adjustments" | "radar" =
    rawTab === "stock" ||
    rawTab === "history" ||
    rawTab === "waste" ||
    rawTab === "adjustments" ||
    rawTab === "radar"
      ? rawTab
      : "catalog";

  const handleTabChange = (
    tab: "catalog" | "stock" | "history" | "waste" | "adjustments" | "radar"
  ) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "catalog") {
        next.delete("tab");
      } else {
        next.set("tab", tab);
      }
      return next;
    });
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isExportingStock, setIsExportingStock] = useState(false);

  const { data: ingredients = [], isPending, isError, error, refetch } = useIngredients();
  const actions = useIngredientActions();

  const handleExportStockCsv = async () => {
    setIsExportingStock(true);
    await downloadCsv("/export/stock.csv", "stok-bahan.csv");
    setIsExportingStock(false);
  };

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
          {activeTab === "catalog" && (
            <button
              onClick={() => actions.setIsCreateOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Tambah master bahan baku baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Bahan</span>
            </button>
          )}

          {activeTab === "stock" && isOwner && (
            <button
              onClick={handleExportStockCsv}
              disabled={isExportingStock}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Ekspor data stok ke CSV"
            >
              <Download className={`w-3.5 h-3.5 ${isExportingStock ? "animate-bounce" : ""}`} />
              <span>{isExportingStock ? "Mengunduh..." : "Ekspor CSV Stok"}</span>
            </button>
          )}

          {activeTab === "history" && (
            <button
              onClick={() => actions.setIsPurchaseModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Catat belanja bahan baku baru"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Catat Nota Belanja</span>
            </button>
          )}

          {activeTab === "waste" && isOwner && (
            <button
              onClick={() => setIsWasteModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Catat bahan rusak atau terbuang"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Catat Terbuang</span>
            </button>
          )}

          {activeTab === "adjustments" && isOwner && (
            <button
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Penyesuaian stok fisik (Opname)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Opname Stok</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => handleTabChange("catalog")}
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
          onClick={() => handleTabChange("stock")}
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
          onClick={() => handleTabChange("history")}
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
            onClick={() => handleTabChange("waste")}
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
            onClick={() => handleTabChange("adjustments")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === "adjustments"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Riwayat Opname</span>
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => handleTabChange("radar")}
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
        <PurchaseHistory onOpenCreate={() => actions.setIsPurchaseModalOpen(true)} />
      ) : activeTab === "stock" ? (
        <InventorySummary
          isOwner={isOwner}
          onOpenPurchase={() => actions.setIsPurchaseModalOpen(true)}
          onOpenCreateIngredient={() => actions.setIsCreateOpen(true)}
        />
      ) : activeTab === "waste" ? (
        <WasteHistoryList onOpenRecordModal={() => setIsWasteModalOpen(true)} />
      ) : activeTab === "adjustments" ? (
        <AdjustmentHistoryList onOpenAdjustmentModal={() => setIsAdjustmentModalOpen(true)} />
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

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default IngredientsPage;
