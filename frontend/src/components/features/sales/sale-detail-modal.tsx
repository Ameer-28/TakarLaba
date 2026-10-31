import { useState } from "react";
import { X, Receipt, Printer, CheckCircle2 } from "lucide-react";
import type { SaleDetail } from "../../../api/hooks/use-sales.js";
import { ReceiptDialog } from "../pos/receipt-dialog.js";
import { SaleMetadataPills } from "./sale-metadata-pills.js";
import { SaleItemCard } from "./sale-item-card.js";
import { SaleFinancialSummary } from "./sale-financial-summary.js";

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
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            <SaleMetadataPills sale={sale} />

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
                {sale.items.map((item) => (
                  <SaleItemCard
                    key={item.id}
                    item={item}
                    isOwner={isOwner}
                    isExpanded={expandedItems[item.id] ?? true}
                    onToggleExpand={() => toggleExpand(item.id)}
                  />
                ))}
              </div>
            </div>

            <SaleFinancialSummary sale={sale} isOwner={isOwner} />
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsReceiptOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Cetak Ulang Struk
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      <ReceiptDialog
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={sale}
        cashReceived={parseFloat(sale.totalAmount)}
      />
    </>
  );
}
