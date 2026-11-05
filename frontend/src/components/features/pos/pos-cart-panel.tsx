import { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Coffee,
  Utensils,
  CupSoda,
  Cake,
} from "lucide-react";
import type { CartItem, PosOrderType } from "./types.js";
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

function getItemMiniIcon(name: string, category: string | null) {
  const text = `${name} ${category ?? ""}`.toLowerCase();
  if (
    text.includes("kopi") ||
    text.includes("coffee") ||
    text.includes("latte") ||
    text.includes("espresso")
  ) {
    return <Coffee className="w-5 h-5 text-[#f27238]" />;
  }
  if (
    text.includes("teh") ||
    text.includes("jus") ||
    text.includes("drink") ||
    text.includes("soda")
  ) {
    return <CupSoda className="w-5 h-5 text-[#f27238]" />;
  }
  if (text.includes("snack") || text.includes("roti") || text.includes("kue")) {
    return <Cake className="w-5 h-5 text-[#f27238]" />;
  }
  return <Utensils className="w-5 h-5 text-[#f27238]" />;
}

export function PosCartPanel({
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onCheckout,
}: PosCartPanelProps) {
  const [orderType, setOrderType] = useState<PosOrderType>("DINE_IN");
  const totalQty = getCartTotalQty(items);
  const totalAmount = getCartTotalAmount(items);

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
            Keranjang
          </h3>
          <span className="text-xs text-stone-500 font-semibold tabular-nums">
            {totalQty > 0 ? `${totalQty} porsi dipilih` : "Belum ada pesanan"}
          </span>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-stone-400 hover:text-rose-600 transition-colors cursor-pointer px-2.5 py-1.5 rounded-full hover:bg-rose-50 flex items-center gap-1.5"
            title="Kosongkan Semua Item (F4)"
          >
            <span>Kosongkan</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-stone-400 bg-stone-100 border border-stone-200 rounded shadow-2xs">
              F4
            </kbd>
          </button>
        )}
      </div>

      {/* Order Type Selector Pills (Matching Purr'Coffee) */}
      <div className="p-3 bg-stone-50/70 border-b border-stone-100">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100/80 rounded-full border border-stone-200/70">
          <button
            type="button"
            onClick={() => setOrderType("DINE_IN")}
            className={`py-1.5 px-2 rounded-full text-xs font-bold transition-all text-center truncate cursor-pointer ${
              orderType === "DINE_IN"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Dine In
          </button>
          <button
            type="button"
            onClick={() => setOrderType("TAKE_AWAY")}
            className={`py-1.5 px-2 rounded-full text-xs font-bold transition-all text-center truncate cursor-pointer ${
              orderType === "TAKE_AWAY"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Take Away
          </button>
          <button
            type="button"
            onClick={() => setOrderType("DELIVERY")}
            className={`py-1.5 px-2 rounded-full text-xs font-bold transition-all text-center truncate cursor-pointer ${
              orderType === "DELIVERY"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Delivery
          </button>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px] max-h-[420px]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2.5">
            <div className="w-14 h-14 rounded-3xl bg-orange-50/70 flex items-center justify-center text-orange-400 border border-orange-100/60 shadow-2xs">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <p className="font-extrabold text-slate-800 text-sm">Keranjang Masih Kosong</p>
            <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
              Pilih menu dari katalog di sebelah kiri untuk mulai memasukkan pesanan pelanggan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {items.map((item) => {
              const lineTotal = item.qty * item.sellingPrice;

              return (
                <div key={item.menuId} className="py-3 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start gap-3">
                    {/* Item Thumbnail */}
                    <div className="w-11 h-11 rounded-2xl bg-orange-50/80 border border-orange-100 flex items-center justify-center shrink-0">
                      {getItemMiniIcon(item.name, item.category)}
                    </div>

                    {/* Item Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="font-bold text-slate-900 text-sm line-clamp-1">
                          {item.name}
                        </h5>
                        <button
                          type="button"
                          onClick={() => onRemove(item.menuId)}
                          className="p-1 text-stone-300 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-stone-400 tabular-nums">
                          {formatRupiah(item.sellingPrice)} &times; {item.qty}
                        </span>
                        <span className="text-xs font-black text-slate-900 tabular-nums">
                          {formatRupiah(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper Bar */}
                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-1.5 bg-stone-100 rounded-full px-2 py-0.5 border border-stone-200/80">
                      <button
                        type="button"
                        onClick={() => onDecrement(item.menuId)}
                        className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-rose-600 hover:bg-white rounded-full transition-colors cursor-pointer shadow-2xs"
                        title="Kurangi kuantitas"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>

                      <span className="text-xs font-black text-slate-900 px-1.5 tabular-nums min-w-[20px] text-center select-none">
                        {item.qty}
                      </span>

                      <button
                        type="button"
                        onClick={() => onIncrement(item.menuId)}
                        className="w-5 h-5 flex items-center justify-center bg-[#f27238] hover:bg-[#e06129] text-white rounded-full transition-colors cursor-pointer shadow-2xs"
                        title="Tambah kuantitas"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bill Summary & Primary CTA (Matching Purr'Coffee) */}
      <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/50 space-y-3">
        <div className="space-y-1.5 text-xs text-stone-600">
          <div className="flex justify-between items-center">
            <span>Item Pesanan</span>
            <span className="tabular-nums font-semibold">{totalQty} porsi</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Tipe Layanan</span>
            <span className="font-bold text-slate-800">
              {orderType === "DINE_IN"
                ? "Dine In"
                : orderType === "TAKE_AWAY"
                  ? "Take Away"
                  : "Delivery"}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-stone-200/80">
            <span className="text-sm font-extrabold text-slate-900">Total Tagihan</span>
            <span className="text-lg font-black text-slate-900 tabular-nums">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full py-3.5 px-4 bg-[#f27238] hover:bg-[#e06129] active:scale-[0.99] text-white font-extrabold text-sm rounded-full shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Bayar Pesanan</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/20 text-white rounded-md">
            F2
          </kbd>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
