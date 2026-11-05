import { useState } from "react";
import {
  ShoppingBag,
  Receipt,
  Search,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
  Ban,
  FilterX,
} from "lucide-react";
import { usePurchases, type PurchaseRecord } from "@/api/hooks/use-purchases";
import { formatRupiah, formatDate } from "@/lib/format";
import { PurchaseBatchDetailModal } from "./purchases/purchase-batch-detail-modal";
import { PurchaseVoidModal } from "./purchases/purchase-void-modal";

interface PurchaseHistoryProps {
  onOpenCreate: () => void;
}

export function PurchaseHistory({ onOpenCreate }: PurchaseHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);
  const [voidingPurchase, setVoidingPurchase] = useState<PurchaseRecord | null>(null);

  const {
    data: purchases = [],
    isPending,
    isError,
    error,
    refetch,
  } = usePurchases({
    supplier: searchTerm.trim() ? searchTerm.trim() : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const hasFilter = Boolean(searchTerm.trim() || startDate || endDate);

  const handleResetFilter = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama supplier atau toko..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-2 bg-white border border-[#CCD0CF] hover:border-[#9BA8AB] rounded-2xl px-3 py-1.5 text-xs text-[#06141B] shadow-2xs transition-colors">
              <Calendar className="w-4 h-4 text-[#253745] shrink-0" />
              <div className="flex items-center gap-1.5 font-medium">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/80 border border-[#CCD0CF] rounded-xl px-2.5 py-1 text-xs text-[#06141B] font-medium focus:ring-2 focus:ring-[#253745]/20 focus:border-[#253745] transition-all cursor-pointer"
                  title="Tanggal Mulai"
                />
                <span className="text-[#4A5C6A] text-xs font-bold">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/80 border border-[#CCD0CF] rounded-xl px-2.5 py-1 text-xs text-[#06141B] font-medium focus:ring-2 focus:ring-[#253745]/20 focus:border-[#253745] transition-all cursor-pointer"
                  title="Tanggal Selesai"
                />
              </div>
            </div>

            {hasFilter && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                title="Reset Filter"
              >
                <FilterX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all justify-center cursor-pointer"
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
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : purchases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {hasFilter ? "Tidak Ada Nota Sesuai Filter" : "Belum Ada Nota Belanja"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {hasFilter
              ? "Coba ubah kata kunci pencarian supplier atau rentang tanggal nota belanja Anda."
              : "Catat nota belanja pertama Anda untuk mengisi persediaan bahan baku dan melacak stok batch FEFO."}
          </p>
          {hasFilter ? (
            <button
              onClick={handleResetFilter}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-all cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Hapus Filter</span>
            </button>
          ) : (
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Catat Nota Belanja</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {purchases.map((purchase) => {
              const totalAmountNum = Number(purchase.totalAmount);
              const batchCount = purchase.batches?.length ?? 0;
              const isVoided = Boolean(purchase.note?.startsWith("[DIBATALKAN"));

              return (
                <div
                  key={purchase.id}
                  className={`p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isVoided ? "opacity-75 bg-slate-50/40" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {purchase.supplierName || "Toko / Pembelian Umum"}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        #{purchase.id.slice(-6)}
                      </span>
                      {isVoided && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <Ban className="w-3 h-3" />
                          <span>Dibatalkan</span>
                        </span>
                      )}
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
                        <span className="text-slate-500 italic max-w-md truncate">
                          &ldquo;{purchase.note}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block">Total Nota</span>
                      <span
                        className={`font-bold text-base tabular-nums ${
                          isVoided ? "line-through text-slate-400" : "text-slate-900"
                        }`}
                      >
                        {formatRupiah(totalAmountNum)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPurchase(purchase)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        Lihat Batch
                      </button>

                      {!isVoided && (
                        <button
                          type="button"
                          onClick={() => setVoidingPurchase(purchase)}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Batalkan nota belanja ini"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
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
        onOpenVoid={(p) => setVoidingPurchase(p)}
      />

      <PurchaseVoidModal
        isOpen={Boolean(voidingPurchase)}
        onClose={() => setVoidingPurchase(null)}
        purchase={voidingPurchase}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default PurchaseHistory;
