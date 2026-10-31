import { Printer, CheckCircle2, Plus } from "lucide-react";
import type { SaleDetail } from "../../../api/hooks/use-sales.js";
import { formatRupiah } from "../../../lib/format.js";
import { useSettings } from "../../../api/hooks/use-settings.js";

interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleDetail | null;
  cashReceived: number;
}

export function ReceiptDialog({ isOpen, onClose, sale, cashReceived }: ReceiptDialogProps) {
  const { data: settings } = useSettings();

  if (!isOpen || !sale) return null;

  const businessName = settings?.name ?? "TakarLaba POS";
  const totalAmountNum = parseFloat(sale.totalAmount);
  const changeNum = Math.max(0, cashReceived - totalAmountNum);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.soldAt).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Success Banner */}
        <div className="bg-emerald-600 p-4 text-white text-center print:hidden">
          <div className="w-10 h-10 rounded-full bg-emerald-500/80 mx-auto flex items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-extrabold text-base">Transaksi Berhasil</h3>
          <p className="text-xs text-emerald-100 mt-0.5">
            Stok batch FEFO telah berhasil dipotong otomatis
          </p>
        </div>

        {/* Printable Thermal Receipt Paper */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 space-y-4 bg-slate-50/50">
          <div
            id="receipt-print-area"
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3"
          >
            {/* Business Header */}
            <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
              <h4 className="font-black text-sm tracking-wider uppercase text-slate-900">
                {businessName}
              </h4>
              <p className="text-[10px] text-slate-500">Struk Pembayaran Resmi</p>
            </div>

            {/* Transaction Metadata */}
            <div className="space-y-1 text-[11px] text-slate-600 pb-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span>No. Struk</span>
                <span className="font-bold text-slate-900">{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu</span>
                <span>{formattedDate} WIB</span>
              </div>
              <div className="flex justify-between">
                <span>Pembayaran</span>
                <span className="font-bold text-slate-900">{sale.paymentMethod}</span>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-2 py-1 border-b border-dashed border-slate-300">
              {sale.items.map((item) => {
                const unitPriceNum = parseFloat(item.unitPrice);
                const lineTotal = item.qty * unitPriceNum;

                return (
                  <div key={item.id} className="space-y-0.5 text-xs">
                    <div className="font-bold text-slate-900">{item.menuNameSnapshot}</div>
                    <div className="flex justify-between text-slate-500 tabular-nums">
                      <span>
                        {item.qty} x {formatRupiah(unitPriceNum)}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatRupiah(lineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total & Payment Summary */}
            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1">
                <span>TOTAL</span>
                <span className="tabular-nums">{formatRupiah(totalAmountNum)}</span>
              </div>

              {sale.paymentMethod === "CASH" && (
                <>
                  <div className="flex justify-between text-slate-600 pt-1 tabular-nums">
                    <span>Tunai</span>
                    <span>{formatRupiah(cashReceived)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 tabular-nums">
                    <span>Kembali</span>
                    <span>{formatRupiah(changeNum)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Receipt Footer */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400 space-y-0.5">
              <p>Terima kasih atas kunjungan Anda!</p>
              <p className="text-[9px] text-slate-400">TakarLaba — Penjaga Margin & Anti-Waste</p>
            </div>
          </div>
        </div>

        {/* Modal Buttons (Hidden when printing) */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Struk</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
}
