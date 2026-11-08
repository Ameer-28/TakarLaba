import { useState, useMemo } from "react";
import { Search, Loader2, AlertCircle, Package, Receipt, Download } from "lucide-react";
import { CustomSelect, type SelectOption } from "@/components/ui/custom-select";
import {
  useInventorySummary,
  useInventoryBatches,
  type IngredientStockSummary,
  type StockBatchItem,
} from "@/api/hooks/use-inventory";
import { useSession } from "@/lib/auth-client";
import { InventoryMetricsHeader } from "./inventory/inventory-metrics-header";
import { InventoryBatchModal } from "./inventory/inventory-batch-modal";
import { InventoryItemCard } from "./inventory/inventory-item-card";
import { WasteRecordModal } from "./inventory/waste-record-modal";
import { StockAdjustmentModal } from "./inventory/stock-adjustment-modal";

interface InventorySummaryProps {
  onOpenPurchase?: () => void;
  onOpenCreateIngredient?: () => void;
  isOwner?: boolean;
  onExportCsv?: () => void;
  isExporting?: boolean;
}

const FILTER_TABS = [
  { id: "ALL", label: "All" },
  { id: "SEGERA", label: "Expiring Soon" },
  { id: "KEDALUWARSA", label: "Expired" },
  { id: "LOW_STOCK", label: "Low Stock" },
  { id: "AMAN", label: "Safe" },
];

const INVENTORY_FILTER_OPTIONS: SelectOption<string>[] = [
  { value: "ALL", label: "All Stock Statuses", description: "All ingredients in inventory" },
  {
    value: "SEGERA",
    label: "Expiring Soon",
    description: "Batches expiring within threshold",
    badge: "Warning",
    badgeColor: "bg-amber-100 text-amber-800",
  },
  {
    value: "KEDALUWARSA",
    label: "Expired",
    description: "Batches past expiration date",
    badge: "Critical",
    badgeColor: "bg-rose-100 text-rose-800",
  },
  {
    value: "LOW_STOCK",
    label: "Low Stock",
    description: "Stock below minimum safety buffer",
    badge: "Reorder",
    badgeColor: "bg-orange-100 text-orange-800",
  },
  {
    value: "AMAN",
    label: "Safe Stock",
    description: "Healthy inventory stock level",
    badge: "Safe",
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
];

export function InventorySummary({
  onOpenPurchase,
  onOpenCreateIngredient,
  isOwner: isOwnerProp,
  onExportCsv,
  isExporting,
}: InventorySummaryProps) {
  const { data: session } = useSession();
  const isOwner = isOwnerProp ?? session?.user?.role !== "CASHIER";

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientStockSummary | null>(null);
  const [wasteModalBatch, setWasteModalBatch] = useState<StockBatchItem | null>(null);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [adjustmentModalBatch, setAdjustmentModalBatch] = useState<StockBatchItem | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const { data: summaries = [], isPending, isError, error, refetch } = useInventorySummary(3);

  const { data: batches = [], isPending: isBatchesPending } = useInventoryBatches(
    selectedIngredient ? { ingredientId: selectedIngredient.id, hasRemainingOnly: true } : undefined
  );

  const stats = useMemo(() => {
    let lowStockCount = 0;
    let soonCount = 0;
    let expiredCount = 0;

    for (const s of summaries) {
      if (s.isLowStock) lowStockCount++;
      if (s.status === "SEGERA") soonCount++;
      if (s.status === "KEDALUWARSA") expiredCount++;
    }

    return {
      total: summaries.length,
      lowStockCount,
      soonCount,
      expiredCount,
    };
  }, [summaries]);

  const filteredSummaries = useMemo(() => {
    return summaries.filter((item) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        if (!item.name.toLowerCase().includes(query)) return false;
      }

      if (statusFilter === "LOW_STOCK") {
        return item.isLowStock;
      }

      if (statusFilter !== "ALL") {
        return item.status === statusFilter;
      }

      return true;
    });
  }, [summaries, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      <InventoryMetricsHeader
        total={stats.total}
        soonCount={stats.soonCount}
        expiredCount={stats.expiredCount}
        lowStockCount={stats.lowStockCount}
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ingredient stock (Coffee, Milk, Rice)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
            />
          </div>

          {/* Tablet & Mobile Dropdown Filter (tampilan tablet kebawah) */}
          <div className="lg:hidden w-full flex items-center gap-2">
            <div className="flex-1 min-w-[170px]">
              <CustomSelect<string>
                value={statusFilter}
                onChange={setStatusFilter}
                options={INVENTORY_FILTER_OPTIONS}
                triggerClassName="py-1.5 px-3 text-xs"
              />
            </div>
            {onExportCsv && isOwner && (
              <button
                type="button"
                onClick={onExportCsv}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs shrink-0 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                title="Export Stock &amp; FEFO Batches CSV"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>Export</span>
              </button>
            )}
          </div>

          {/* Desktop Filter Tabs */}
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto w-auto pb-0 scrollbar-none">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}

            {onExportCsv && isOwner && (
              <button
                type="button"
                onClick={onExportCsv}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs ml-2 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                title="Export Stock &amp; FEFO Batches CSV"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading inventory stock summary...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-xs text-slate-600">
            {error instanceof Error ? error.message : "Failed to load inventory status."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : summaries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">No ingredient stock data yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start by adding master ingredients or record a purchase invoice to populate FEFO batch
              stocks.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={onOpenCreateIngredient}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
            >
              Add Ingredient
            </button>
            <button
              onClick={onOpenPurchase}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Record Purchase</span>
            </button>
          </div>
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No matching stock found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Change your search terms or adjust inventory status filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredSummaries.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              isOwner={isOwner}
              onSelectIngredient={setSelectedIngredient}
            />
          ))}
        </div>
      )}

      <InventoryBatchModal
        ingredient={selectedIngredient}
        onClose={() => setSelectedIngredient(null)}
        batches={batches}
        isPending={isBatchesPending}
        isOwner={isOwner}
        onRecordWaste={(batch) => {
          setWasteModalBatch(batch);
          setIsWasteModalOpen(true);
        }}
        onRecordAdjustment={(batch) => {
          setAdjustmentModalBatch(batch);
          setIsAdjustmentModalOpen(true);
        }}
      />

      <WasteRecordModal
        isOpen={isWasteModalOpen}
        onClose={() => {
          setIsWasteModalOpen(false);
          setWasteModalBatch(null);
        }}
        initialBatch={wasteModalBatch}
        onSuccess={() => refetch()}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setAdjustmentModalBatch(null);
        }}
        initialBatch={adjustmentModalBatch}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default InventorySummary;
