import { useState } from "react";
import {
  X,
  Receipt,
  Printer,
  Calendar,
  Clock,
  User,
  CreditCard,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import type { SaleDetail } from "../../../api/hooks/use-sales.js";
import { formatRupiah, formatQuantity } from "../../../lib/format.js";
import { ReceiptDialog } from "../pos/receipt-dialog.js";

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleDetail | null;
  isOwner?: boolean;
}

export function SaleDetailModal({ isOpen, onClose, sale, isOwner = false }: SaleDetailModalProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  if (!isOpen || !sale) return null;

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const soldDate = new Date(sale.soldAt);
  const formattedDate = soldDate.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = soldDate.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });

  const paymentLabels: Record<string, string> = {
    CASH: "Tunai",
    QRIS: "QRIS",
    TRANSFER: "Transfer",
  };

  const paymentBadgeColors: Record<string, string> = {
    CASH: "bg-emerald-50 text-emerald-700 border-emerald-200",
    QRIS: "bg-blue-50 text-blue-700 border-blue-200",
    TRANSFER: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {sale.invoiceNo}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Selesai
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rincian transaksi dan detail alokasi stok batch FEFO
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            {/* Metadata Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal
                </span>
                <span className="font-bold text-slate-800">{formattedDate}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5" /> Waktu
                </span>
                <span className="font-bold text-slate-800">{formattedTime} WIB</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5" /> Kasir
                </span>
                <span className="font-bold text-slate-800 truncate block">
                  {sale.cashier?.name ?? "Kasir"}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 flex items-center gap-1 mb-1">
                  <CreditCard className="w-3.5 h-3.5" /> Pembayaran
                </span>
                <span
                  className={`inline-block font-bold px-2 py-0.5 rounded-md border text-[11px] ${
                    paymentBadgeColors[sale.paymentMethod] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}
                </span>
              </div>
            </div>

            {/* Menu Items Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase">
                  Daftar Menu ({sale.items.length} Menu)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Klik item untuk melihat alokasi batch
                </span>
              </div>

              <div className="space-y-2.5">
                {sale.items.map((item) => {
                  const hasBatchAllocations =
                    item.batchAllocations && item.batchAllocations.length > 0;
                  const isExpanded = expandedItems[item.id] ?? true; // default expanded to show FEFO
                  const unitPriceNum = parseFloat(item.unitPrice);
                  const subtotalNum = item.qty * unitPriceNum;

                  return (
                    <div
                      key={item.id}
                      className="border border-slate-200/80 rounded-2xl p-4 bg-white hover:border-slate-300 transition-colors space-y-3"
                    >
                      {/* Item Top Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h5 className="font-bold text-slate-900 text-sm">
                            {item.menuNameSnapshot}
                          </h5>
                          <div className="text-xs text-slate-500 tabular-nums">
                            {item.qty} porsi × {formatRupiah(unitPriceNum)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-slate-900 text-sm tabular-nums">
                            {formatRupiah(subtotalNum)}
                          </div>
                          {isOwner && item.grossMargin && item.marginPercentage && (
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 justify-end mt-0.5">
                              <TrendingUp className="w-3 h-3" />
                              <span>
                                Margin {item.marginPercentage}% ({formatRupiah(item.grossMargin)})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Item Cost Breakdown (OWNER only) */}
                      {isOwner && item.ingredientCostActual && item.overheadAllocated && (
                        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">HPP Bahan</span>
                            <span className="font-bold text-slate-700 tabular-nums">
                              {formatRupiah(item.ingredientCostActual)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Beban Overhead</span>
                            <span className="font-bold text-slate-700 tabular-nums">
                              {formatRupiah(item.overheadAllocated)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Laba Bersih</span>
                            <span className="font-bold text-emerald-600 tabular-nums">
                              {formatRupiah(item.grossMargin)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* FEFO Batch Allocation Breakdown */}
                      {hasBatchAllocations && (
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 py-1"
                          >
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-amber-500" />
                              Alokasi Batch Bahan (FEFO) ({item.batchAllocations?.length} batch)
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-1.5">
                              {item.batchAllocations?.map((alloc) => {
                                const expiryFormatted = alloc.batchExpiryDate
                                  ? new Date(alloc.batchExpiryDate).toLocaleDateString("id-ID", {
                                      timeZone: "Asia/Jakarta",
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "Tanpa Kedaluwarsa";

                                return (
                                  <div
                                    key={alloc.movementId}
                                    className="p-2.5 bg-amber-50/40 border border-amber-200/50 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">
                                          {alloc.ingredientName}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-800 font-semibold">
                                          Exp: {expiryFormatted}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        Batch #{alloc.batchId?.slice(-6) ?? "N/A"}
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                                      <div className="text-left sm:text-right">
                                        <span className="text-[10px] text-slate-400 block sm:hidden">
                                          Pemotongan
                                        </span>
                                        <span className="font-bold text-slate-800 tabular-nums">
                                          {formatQuantity(alloc.qtyDeducted, alloc.baseUnit)}
                                        </span>
                                      </div>

                                      {/* Cost per base & subtotal (OWNER only) */}
                                      {isOwner && alloc.costPerBase && alloc.subtotalCost && (
                                        <div className="border-l border-amber-200/60 pl-3">
                                          <span className="text-[10px] text-slate-500 block tabular-nums">
                                            @ Rp
                                            {parseFloat(alloc.costPerBase).toLocaleString("id-ID")}/
                                            {alloc.baseUnit}
                                          </span>
                                          <span className="font-bold text-amber-900 tabular-nums">
                                            {formatRupiah(alloc.subtotalCost)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Total Omzet Penjualan</span>
                <span className="text-white text-base font-extrabold tabular-nums">
                  {formatRupiah(sale.totalAmount)}
                </span>
              </div>

              {isOwner && sale.totalIngredientCost && sale.totalOverhead && (
                <>
                  <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Total HPP Bahan Baku</span>
                      <span className="font-semibold tabular-nums text-slate-200">
                        {formatRupiah(sale.totalIngredientCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Total Alokasi Beban Overhead</span>
                      <span className="font-semibold tabular-nums text-slate-200">
                        {formatRupiah(sale.totalOverhead)}
                      </span>
                    </div>
                  </div>

                  {sale.grossMargin && sale.marginPercentage && (
                    <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm text-emerald-400 block">
                          Laba Kotor / Margin
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Persentase Margin: {sale.marginPercentage}%
                        </span>
                      </div>
                      <span className="text-lg font-black text-emerald-400 tabular-nums">
                        {formatRupiah(sale.grossMargin)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsReceiptOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Cetak Ulang Struk
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Thermal Receipt Print Dialog */}
      <ReceiptDialog
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={sale}
        cashReceived={parseFloat(sale.totalAmount)}
      />
    </>
  );
}
