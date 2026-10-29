import { useState, useMemo } from "react";
import { X, Banknote, QrCode, ArrowRightLeft, AlertCircle, Loader2, Check } from "lucide-react";
import type { CartItem } from "./types.js";
import {
  useCheckoutSale,
  type PaymentMethod,
  type SaleDetail,
} from "../../../api/hooks/use-sales.js";
import { formatRupiah } from "../../../lib/format.js";
import { generateIdempotencyKey } from "../../../api/client.js";
import { getCartTotalAmount } from "./cart-reducer.js";

interface PosCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onSuccess: (sale: SaleDetail, cashReceived: number) => void;
}

export function PosCheckoutModal({ isOpen, onClose, cartItems, onSuccess }: PosCheckoutModalProps) {
  const totalAmount = getCartTotalAmount(cartItems);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashReceivedInput, setCashReceivedInput] = useState<string>(totalAmount.toString());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkoutMutation = useCheckoutSale();

  const cashReceived = useMemo(() => {
    const parsed = parseInt(cashReceivedInput.replace(/\D/g, ""), 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [cashReceivedInput]);

  const change = Math.max(0, cashReceived - totalAmount);
  const isCashInsufficient = paymentMethod === "CASH" && cashReceived < totalAmount;

  // Quick cash recommendation buttons
  const quickCashOptions = useMemo(() => {
    const set = new Set<number>();
    set.add(totalAmount); // Uang pas

    const denominations = [10000, 20000, 50000, 100000];
    for (const denom of denominations) {
      if (denom >= totalAmount) {
        set.add(denom);
      } else {
        const nextRound = Math.ceil(totalAmount / denom) * denom;
        if (nextRound > totalAmount && nextRound <= 500000) {
          set.add(nextRound);
        }
      }
    }

    return Array.from(set)
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [totalAmount]);

  if (!isOpen) return null;

  const handleProcessCheckout = async () => {
    setErrorMessage(null);

    if (isCashInsufficient) {
      setErrorMessage("Nominal uang yang diterima kurang dari total tagihan pesanan.");
      return;
    }

    const payload = {
      paymentMethod,
      items: cartItems.map((item) => ({
        menuId: item.menuId,
        qty: item.qty,
      })),
    };

    const idempotencyKey = generateIdempotencyKey();

    try {
      const sale = await checkoutMutation.mutateAsync({
        payload,
        idempotencyKey,
      });

      onSuccess(sale, paymentMethod === "CASH" ? cashReceived : totalAmount);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Gagal memproses transaksi kasir.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Pembayaran Kasir</h3>
            <span className="text-xs text-slate-500 font-medium">
              Selesaikan transaksi dan catat pembayaran pelanggan
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={checkoutMutation.isPending}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal Menyimpan Transaksi</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Total Tagihan Card */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Tagihan
            </span>
            <p className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {formatRupiah(totalAmount)}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">
              {cartItems.reduce((acc, it) => acc + it.qty, 0)} porsi menu
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === "CASH"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
                <span className="text-xs">Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("QRIS")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === "QRIS"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <QrCode className="w-5 h-5 mb-1 text-sky-600" />
                <span className="text-xs">QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("TRANSFER")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === "TRANSFER"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ArrowRightLeft className="w-5 h-5 mb-1 text-purple-600" />
                <span className="text-xs">Transfer</span>
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === "CASH" ? (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Uang Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cashReceived ? cashReceived.toLocaleString("id-ID") : ""}
                    onChange={(e) => setCashReceivedInput(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 text-base font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 tabular-nums transition-all"
                  />
                </div>
              </div>

              {/* Quick Cash Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5">
                {quickCashOptions.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCashReceivedInput(amount.toString())}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer border ${
                      cashReceived === amount
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {amount === totalAmount ? "Uang Pas" : formatRupiah(amount)}
                  </button>
                ))}
              </div>

              {/* Kembalian Box */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                  isCashInsufficient
                    ? "bg-amber-50/70 border-amber-200 text-amber-900"
                    : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    {isCashInsufficient ? "Kurang Bayar" : "Kembalian"}
                  </span>
                  <span className="text-xl font-black tabular-nums">
                    {formatRupiah(isCashInsufficient ? totalAmount - cashReceived : change)}
                  </span>
                </div>

                {!isCashInsufficient && (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-2xl text-xs text-sky-900 space-y-1">
              <p className="font-bold">
                {paymentMethod === "QRIS"
                  ? "Tunjukkan QRIS kasir ke pelanggan"
                  : "Periksa bukti transfer pelanggan"}
              </p>
              <p className="text-sky-800 leading-relaxed">
                Pastikan dana senilai <strong>{formatRupiah(totalAmount)}</strong> telah berhasil
                masuk ke rekening usaha sebelum menyelesaikan transaksi.
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={checkoutMutation.isPending}
            className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleProcessCheckout}
            disabled={checkoutMutation.isPending || isCashInsufficient}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs shadow-emerald-700/20 transition-all cursor-pointer"
          >
            {checkoutMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses FEFO...</span>
              </>
            ) : (
              <span>Selesaikan Transaksi</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
