import { useState, useMemo } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  Package,
  Layers,
  Search,
  Loader2,
  AlertCircle,
  X,
  Receipt,
  Calendar,
} from "lucide-react";
import {
  useInventorySummary,
  useInventoryBatches,
  type IngredientStockSummary,
  type StockStatus,
} from "@/api/hooks/use-inventory";
import { useSession } from "@/lib/auth-client";
import { formatNumber, formatRupiah, formatDate } from "@/lib/format";

interface InventorySummaryProps {
  onOpenPurchase: () => void;
  onOpenCreateIngredient: () => void;
}

const STATUS_BADGES: Record<
  StockStatus,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  AMAN: {
    label: "Aman",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: ShieldCheck,
  },
  SEGERA: {
    label: "Segera Kedaluwarsa",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  KEDALUWARSA: {
    label: "Ada Kedaluwarsa",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertTriangle,
  },
  HABIS: {
    label: "Stok Habis",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
    icon: AlertCircle,
  },
};

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

  // Batches for the selected ingredient
  const { data: batches = [], isPending: isBatchesPending } = useInventoryBatches(
    selectedIngredient ? { ingredientId: selectedIngredient.id, hasRemainingOnly: true } : undefined
  );

  // Overall metric counts
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

  // Filtered summaries
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
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Master Bahan</span>
          <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{stats.total}</span>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 font-semibold block">Segera Kedaluwarsa</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-extrabold text-amber-700 tabular-nums">
            {stats.soonCount}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">dalam 3 hari ke depan</span>
        </div>

        <div className="bg-white rounded-2xl border border-rose-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-700 font-semibold block">Bahan Kedaluwarsa</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-extrabold text-rose-700 tabular-nums">
            {stats.expiredCount}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">harus segera dipisahkan</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-semibold block">Stok Menipis</span>
            <AlertCircle className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {stats.lowStockCount}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">di bawah batas aman</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            {[
              { id: "ALL", label: "Semua" },
              { id: "SEGERA", label: "Segera" },
              { id: "KEDALUWARSA", label: "Kedaluwarsa" },
              { id: "LOW_STOCK", label: "Stok Rendah" },
              { id: "AMAN", label: "Aman" },
            ].map((tab) => (
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

      {/* List Content */}
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
          {filteredSummaries.map((item) => {
            const statusMeta = STATUS_BADGES[item.status];
            const StatusIcon = statusMeta.icon;
            const validStockNum = Number(item.validStockBase);
            const expiredStockNum = Number(item.expiredStockBase);
            const minStockNum = Number(item.minStockBase);

            return (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{item.name}</span>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusMeta.label}</span>
                    </span>

                    {/* Low Stock Warning */}
                    {item.isLowStock && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>Stok Rendah</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      Satuan:{" "}
                      <span className="font-semibold text-slate-700 uppercase font-mono">
                        {item.baseUnit}
                      </span>
                    </span>

                    <span>
                      Batas Aman:{" "}
                      <span className="font-mono text-slate-700">
                        {formatNumber(minStockNum)} {item.baseUnit.toLowerCase()}
                      </span>
                    </span>

                    {item.nearestExpiryDate && (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Exp Terdekat: {formatDate(item.nearestExpiryDate)}</span>
                      </span>
                    )}

                    {isOwner && item.averageCostPerBase && (
                      <span className="text-emerald-700 font-semibold font-mono">
                        Rata-rata: {formatRupiah(Number(item.averageCostPerBase), true)} /{" "}
                        {item.baseUnit.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock figures and Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Stok Valid</span>
                    <span
                      className={`text-lg font-extrabold tabular-nums block ${
                        item.isLowStock ? "text-rose-600" : "text-slate-900"
                      }`}
                    >
                      {formatNumber(validStockNum)} {item.baseUnit.toLowerCase()}
                    </span>

                    {expiredStockNum > 0 && (
                      <span className="text-[11px] text-rose-600 font-bold block tabular-nums">
                        + {formatNumber(expiredStockNum)} kedaluwarsa
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedIngredient(item)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Batch FEFO ({item.activeBatchCount})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail Batch FEFO */}
      {selectedIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900">
                  Urutan Batch FEFO: {selectedIngredient.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Stok akan terpotong otomatis dari batch yang paling awal kedaluwarsa saat
                  penjualan POS.
                </p>
              </div>
              <button
                onClick={() => setSelectedIngredient(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isBatchesPending ? (
                <div className="p-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                  <p className="text-xs text-slate-500">Memuat rincian batch...</p>
                </div>
              ) : batches.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  Tidak ada batch aktif dengan sisa stok untuk bahan ini.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {batches.map((batch, idx) => {
                    const statusMeta = STATUS_BADGES[batch.status];
                    const remainingNum = Number(batch.remainingQtyBase);
                    const initialNum = Number(batch.initialQtyBase);
                    const costNum = batch.costPerBase ? Number(batch.costPerBase) : null;

                    return (
                      <div key={batch.id} className="p-3.5 bg-white hover:bg-slate-50/60 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold font-mono flex items-center justify-center">
                                #{idx + 1}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.badgeClass}`}
                              >
                                {statusMeta.label}
                              </span>
                              {batch.expiryDate ? (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>Kedaluwarsa: {formatDate(batch.expiryDate)}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">Tanpa Kedaluwarsa</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>Diterima: {formatDate(batch.receivedAt)}</span>
                              {batch.supplierName && <span>• Dari: {batch.supplierName}</span>}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-slate-900 text-sm tabular-nums block">
                              Sisa: {formatNumber(remainingNum)} / {formatNumber(initialNum)}{" "}
                              {batch.baseUnit.toLowerCase()}
                            </span>
                            {isOwner && costNum !== null && (
                              <span className="text-[11px] text-emerald-700 font-mono">
                                {formatRupiah(costNum, true)} / {batch.baseUnit.toLowerCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setSelectedIngredient(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
