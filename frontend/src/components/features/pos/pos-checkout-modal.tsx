import { useState, useMemo, useEffect } from "react";
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

  const quickCashOptions = useMemo(() => calculateQuickCashOptions(totalAmount), [totalAmount]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !checkoutMutation.isPending) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, checkoutMutation.isPending]);

  if (!isOpen) return null;

  const handleProcessCheckout = async () => {
    setErrorMessage(null);

    if (isCashInsufficient) {
      setErrorMessage("Cash received is less than total amount due.");
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
        setErrorMessage("Failed to process cashier transaction.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Cashier Checkout</h3>
            <span className="text-xs text-slate-500 font-medium">
              Complete transaction and record customer payment
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
                <p className="font-bold">Transaction Failed</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Amount
            </span>
            <p className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {formatRupiah(totalAmount)}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">
              {cartItems.reduce((acc, it) => acc + it.qty, 0)} item(s)
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
                  ? "Show cashier QRIS code to customer"
                  : "Verify customer transfer receipt"}
              </p>
              <p className="text-sky-800 leading-relaxed">
                Ensure the amount of <strong>{formatRupiah(totalAmount)}</strong> has been
                successfully received in the business account before completing.
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
            className="px-4 py-2.5 text-sm font-bold text-stone-600 hover:text-stone-800 hover:bg-stone-200/60 rounded-full transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleProcessCheckout}
            disabled={checkoutMutation.isPending || isCashInsufficient}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-extrabold text-white bg-[#11212D] hover:bg-[#253745] active:bg-[#06141B] disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-md shadow-[#11212D]/20 transition-all cursor-pointer"
          >
            {checkoutMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing FEFO...</span>
              </>
            ) : (
              <span>Complete Transaction</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
