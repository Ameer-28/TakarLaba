import { useState, useMemo } from "react";
import { Search, Loader2, AlertCircle, Package, Receipt } from "lucide-react";
import {
  useInventorySummary,
  useInventoryBatches,
  type IngredientStockSummary,
} from "@/api/hooks/use-inventory";
import { useSession } from "@/lib/auth-client";
import { InventoryMetricsHeader } from "./inventory/inventory-metrics-header";
import { InventoryBatchModal } from "./inventory/inventory-batch-modal";
import { InventoryItemCard } from "./inventory/inventory-item-card";

interface InventorySummaryProps {
  onOpenPurchase: () => void;
  onOpenCreateIngredient: () => void;
}

const FILTER_TABS = [
  { id: "ALL", label: "Semua" },
  { id: "SEGERA", label: "Segera" },
  { id: "KEDALUWARSA", label: "Kedaluwarsa" },
  { id: "LOW_STOCK", label: "Stok Rendah" },
  { id: "AMAN", label: "Aman" },
];

export function InventorySummary({
  onOpenPurchase,
  onOpenCreateIngredient,
}: InventorySummaryProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.role !== "CASHIER";

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientStockSummary | null>(null);

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
              placeholder="Cari status stok bahan (Kopi, Susu, Beras)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Memuat ringkasan stok persediaan...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-xs text-slate-600">
            {error instanceof Error ? error.message : "Gagal memuat status persediaan."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            Coba Lagi
          </button>
        </div>
      ) : summaries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Belum ada data stok bahan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Mulai dengan menambahkan master bahan baku atau catat nota belanja baru untuk mengisi
              stok batch FEFO.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={onOpenCreateIngredient}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all"
            >
              Tambah Bahan
            </button>
            <button
              onClick={onOpenPurchase}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Catat Belanja</span>
            </button>
          </div>
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Tidak ada stok yang sesuai</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ubah kata kunci pencarian atau sesuaikan filter status persediaan Anda.
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
      />
    </div>
  );
}

export default InventorySummary;
