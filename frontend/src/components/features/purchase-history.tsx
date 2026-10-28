import { useState } from "react";
import { ShoppingBag, Receipt, Search, Calendar, Layers, Loader2, AlertCircle } from "lucide-react";
import { usePurchases, type PurchaseRecord } from "@/api/hooks/use-purchases";
import { formatRupiah, formatDate } from "@/lib/format";
import { PurchaseBatchDetailModal } from "./purchases/purchase-batch-detail-modal";

interface PurchaseHistoryProps {
  onOpenCreate: () => void;
}

export function PurchaseHistory({ onOpenCreate }: PurchaseHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);

  const {
    data: purchases = [],
    isPending,
    isError,
    error,
    refetch,
  } = usePurchases({
    supplier: searchTerm.trim() ? searchTerm.trim() : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama supplier atau toko..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all w-full sm:w-auto justify-center"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Catat Nota Baru</span>
        </button>
      </div>

      {isPending ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Memuat riwayat pembelian...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-xs text-slate-600">
            {error instanceof Error ? error.message : "Gagal memuat riwayat pembelian."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            Coba Lagi
          </button>
        </div>
      ) : purchases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Belum Ada Nota Belanja</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Catat nota belanja pertama Anda untuk mengisi persediaan bahan baku dan melacak stok
            batch FEFO.
          </p>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Catat Nota Belanja</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {purchases.map((purchase) => {
              const totalAmountNum = Number(purchase.totalAmount);
              const batchCount = purchase.batches?.length ?? 0;

              return (
                <div
                  key={purchase.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {purchase.supplierName || "Toko / Pembelian Umum"}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        #{purchase.id.slice(-6)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(purchase.purchasedAt)}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 font-medium">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{batchCount} bahan belanja</span>
                      </span>

                      {purchase.note && (
                        <span className="text-slate-400 italic">"{purchase.note}"</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block">Total Nota</span>
                      <span className="font-bold text-slate-900 text-base tabular-nums">
                        {formatRupiah(totalAmountNum)}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedPurchase(purchase)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
                    >
                      Lihat Batch
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PurchaseBatchDetailModal
        purchase={selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
      />
    </div>
  );
}

export default PurchaseHistory;
