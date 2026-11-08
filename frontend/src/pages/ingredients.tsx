import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Receipt, Layers, Trash2, Boxes, AlertTriangle, SlidersHorizontal } from "lucide-react";
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
import { CustomSelect, type SelectOption } from "@/components/ui/custom-select";
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
    await downloadCsv("/export/stock.csv", "ingredient-stock.csv");
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

  const tabOptions = useMemo(() => {
    const opts: SelectOption<
      "catalog" | "stock" | "history" | "waste" | "adjustments" | "radar"
    >[] = [
      {
        value: "catalog",
        label: `Ingredient Catalog (${ingredients.length})`,
        description: "Master list, units of measure, and active status",
        icon: Layers,
      },
      {
        value: "stock",
        label: "Stock & FEFO",
        description: "Monitor remaining stock batches and expiration dates",
        icon: Boxes,
      },
      {
        value: "history",
        label: "Purchase Invoices",
        description: "Purchase records, receiving dates, and suppliers",
        icon: Receipt,
      },
    ];

    if (isOwner) {
      opts.push(
        {
          value: "waste",
          label: "Waste Log",
          description: "Record spoiled, expired, or spilled items",
          icon: Trash2,
          badgeColor: "bg-rose-100 text-rose-800",
        },
        {
          value: "adjustments",
          label: "Stock Adjustments",
          description: "Physical stock opname deviations and corrections",
          icon: SlidersHorizontal,
          badgeColor: "bg-sky-100 text-sky-800",
        },
        {
          value: "radar",
          label: "Waste Radar",
          description: "Early warning expiry risks and promo discount floors",
          icon: AlertTriangle,
          badgeColor: "bg-amber-100 text-amber-800",
        }
      );
    }

    return opts;
  }, [ingredients.length, isOwner]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Tablet & Mobile Tab Dropdown Selector (tampilan tablet kebawah) */}
      <div className="lg:hidden bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Menu / Fitur Bahan &amp; Stok
        </label>
        <CustomSelect
          value={activeTab}
          onChange={(val) => handleTabChange(val)}
          options={tabOptions}
        />
      </div>

      {/* Desktop Horizontal Tabs */}
      <div className="hidden lg:flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => handleTabChange("catalog")}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap ${
            activeTab === "catalog"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ingredient Catalog ({ingredients.length})</span>
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
          <span>Stock &amp; FEFO</span>
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
          <span>Purchase Invoices</span>
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
            <span>Waste Log</span>
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
            <span>Stock Adjustments</span>
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
          onExportCsv={handleExportStockCsv}
          isExporting={isExportingStock}
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
