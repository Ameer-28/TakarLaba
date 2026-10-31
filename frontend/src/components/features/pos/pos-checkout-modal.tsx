import { useState, useMemo } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import type { CartItem } from "./types.js";
import {
  useCheckoutSale,
  type PaymentMethod,
  type SaleDetail,
} from "../../../api/hooks/use-sales.js";
import { formatRupiah } from "../../../lib/format.js";
import { generateIdempotencyKey } from "../../../api/client.js";
import { getCartTotalAmount } from "./cart-reducer.js";
import { calculateQuickCashOptions } from "./pos-utils.js";
import { PaymentMethodSelector } from "./payment-method-selector.js";
import { CashPaymentFields } from "./cash-payment-fields.js";

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

  const quickCashOptions = useMemo(
    () => calculateQuickCashOptions(totalAmount),
    [totalAmount]
  );

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
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal Menyimpan Transaksi</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

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

          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

          {paymentMethod === "CASH" ? (
            <CashPaymentFields
              cashReceived={cashReceived}
              totalAmount={totalAmount}
              change={change}
              isCashInsufficient={isCashInsufficient}
              quickCashOptions={quickCashOptions}
              onChangeInput={setCashReceivedInput}
              onSelectOption={(amount) => setCashReceivedInput(amount.toString())}
            />
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
