import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import type { CartItem } from "./types.js";
import { formatRupiah } from "../../../lib/format.js";
import { getCartTotalQty, getCartTotalAmount } from "./cart-reducer.js";

interface PosCartPanelProps {
  items: CartItem[];
  onIncrement: (menuId: string) => void;
  onDecrement: (menuId: string) => void;
  onRemove: (menuId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function PosCartPanel({
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onCheckout,
}: PosCartPanelProps) {
  const totalQty = getCartTotalQty(items);
  const totalAmount = getCartTotalAmount(items);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Keranjang Pesanan</h3>
            <span className="text-xs text-slate-500 tabular-nums font-medium">
              {totalQty} porsi dipilih
            </span>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-50"
          >
            Kosongkan
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 text-sm">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Klik menu pada katalog untuk menambahkan pesanan pelanggan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const lineTotal = item.qty * item.sellingPrice;

              return (
                <div key={item.menuId} className="py-3 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{item.name}</h5>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {formatRupiah(item.sellingPrice)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(item.menuId)}
                      className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Hapus menu dari keranjang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Stepper buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => onDecrement(item.menuId)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-900 tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onIncrement(item.menuId)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Subtotal */}
                    <span className="font-bold text-slate-900 text-sm tabular-nums">
                      {formatRupiah(lineTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer & Checkout Button */}
      {items.length > 0 && (
        <div className="p-4 bg-slate-50/75 border-t border-slate-100 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Tagihan
            </span>
            <span className="text-xl font-black text-slate-900 tabular-nums">
              {formatRupiah(totalAmount)}
            </span>
          </div>

          <button
            type="button"
            onClick={onCheckout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <span>Bayar Pesanan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
