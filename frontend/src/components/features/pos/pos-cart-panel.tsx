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
import { formatPosMenuName } from "./pos-utils.js";

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
    return <Coffee className="w-5 h-5 text-[#253745]" />;
  }
  if (
    text.includes("teh") ||
    text.includes("jus") ||
    text.includes("drink") ||
    text.includes("soda")
  ) {
    return <CupSoda className="w-5 h-5 text-[#253745]" />;
  }
  if (text.includes("snack") || text.includes("roti") || text.includes("kue")) {
    return <Cake className="w-5 h-5 text-[#253745]" />;
  }
  return <Utensils className="w-5 h-5 text-[#253745]" />;
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
    <div className="bg-white rounded-3xl border border-[#CCD0CF] shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#CCD0CF] flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-extrabold text-[#06141B] text-base sm:text-lg tracking-tight">
            Keranjang
          </h3>
          <span className="text-xs text-[#4A5C6A] font-semibold tabular-nums">
            {totalQty > 0 ? `${totalQty} porsi dipilih` : "Belum ada pesanan"}
          </span>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-[#4A5C6A] hover:text-rose-600 transition-colors cursor-pointer px-2.5 py-1.5 rounded-full hover:bg-rose-50 flex items-center gap-1.5"
            title="Kosongkan Semua Item (F4)"
          >
            <span>Kosongkan</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-[#4A5C6A] bg-[#CCD0CF]/30 border border-[#CCD0CF] rounded shadow-2xs">
              F4
            </kbd>
          </button>
        )}
      </div>

      {/* Order Type Selector Pills (Matching Purr'Coffee) */}
      <div className="p-3 bg-slate-50/50 border-b border-[#CCD0CF] shrink-0">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#CCD0CF]/30 rounded-full border border-[#CCD0CF]">
          <button
            type="button"
            onClick={() => setOrderType("DINE_IN")}
            className={`py-1.5 px-2 rounded-full text-xs font-bold transition-all text-center truncate cursor-pointer ${
              orderType === "DINE_IN"
                ? "bg-[#11212D] text-white shadow-2xs"
                : "text-[#4A5C6A] hover:text-[#06141B]"
            }`}
          >
            Dine In
          </button>
          <button
            type="button"
            onClick={() => setOrderType("TAKE_AWAY")}
            className={`py-1.5 px-2 rounded-full text-xs font-bold transition-all text-center truncate cursor-pointer ${
              orderType === "TAKE_AWAY"
                ? "bg-[#11212D] text-white shadow-2xs"
                : "text-[#4A5C6A] hover:text-[#06141B]"
            }`}
          >
            Take Away
          </button>
          <button
            type="button"
            onClick={() => setOrderType("DELIVERY")}
            className={`py-1.5 px-2 rounded-full text-xs font-bold transition-all text-center truncate cursor-pointer ${
              orderType === "DELIVERY"
                ? "bg-[#11212D] text-white shadow-2xs"
                : "text-[#4A5C6A] hover:text-[#06141B]"
            }`}
          >
            Delivery
          </button>
        </div>
      </div>

      {/* Cart Items List: flex-1 min-h-0 fills the entire remaining vertical height */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex-1 min-h-0 flex flex-col items-center justify-center text-center p-6 text-[#4A5C6A] space-y-2.5 my-auto">
            <div className="w-14 h-14 rounded-3xl bg-[#CCD0CF]/30 flex items-center justify-center text-[#253745] border border-[#CCD0CF] shadow-2xs">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <p className="font-extrabold text-[#06141B] text-sm">Keranjang Masih Kosong</p>
            <p className="text-xs text-[#4A5C6A] max-w-xs leading-relaxed">
              Pilih menu dari katalog di sebelah kiri untuk mulai memasukkan pesanan pelanggan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const lineTotal = item.qty * item.sellingPrice;
              const itemKey =
                item.cartKey ??
                (item.temperature ? `${item.menuId}-${item.temperature}` : item.menuId);

              return (
                <div key={itemKey} className="py-3 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start gap-3">
                    {/* Item Thumbnail */}
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-[#CCD0CF] flex items-center justify-center shrink-0">
                      {getItemMiniIcon(item.name, item.category)}
                    </div>

                    {/* Item Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <h5 className="font-extrabold text-[#06141B] text-sm line-clamp-1">
                            {formatPosMenuName(item.name)}
                          </h5>
                          {item.temperature === "ICE" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-sky-50 text-sky-700 border border-sky-200/80 shrink-0">
                              Dingin
                            </span>
                          )}
                          {item.temperature === "HOT" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                              Panas
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemove(itemKey)}
                          className="p-1 text-[#9BA8AB] hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Total & Stepper (Matching Purr'Coffee Layout) */}
                      <div className="flex items-center justify-between mt-2 pt-0.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-[#11212D] tabular-nums">
                            {formatRupiah(lineTotal)}
                          </span>
                          {item.qty > 1 && (
                            <span className="text-[10px] text-[#4A5C6A] tabular-nums font-medium">
                              {formatRupiah(item.sellingPrice)} / porsi
                            </span>
                          )}
                        </div>

                        {/* Quantity Stepper Bar */}
                        <div className="flex items-center gap-1.5 bg-slate-100/90 rounded-full px-2 py-0.5 border border-[#CCD0CF]/60 select-none">
                          <button
                            type="button"
                            onClick={() => onDecrement(itemKey)}
                            className="w-5 h-5 flex items-center justify-center text-slate-700 hover:text-rose-600 hover:bg-white rounded-full transition-colors cursor-pointer shadow-2xs text-xs font-bold"
                            title="Kurangi kuantitas"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>

                          <span className="text-xs font-black text-[#06141B] px-1 tabular-nums min-w-[16px] text-center select-none">
                            {item.qty}
                          </span>

                          <button
                            type="button"
                            onClick={() => onIncrement(itemKey)}
                            className="w-5 h-5 flex items-center justify-center bg-[#11212D] hover:bg-[#253745] text-white rounded-full transition-colors cursor-pointer shadow-2xs text-xs font-bold"
                            title="Tambah kuantitas"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bill Summary & Primary CTA (Pinned at the bottom) */}
      <div className="p-4 sm:p-5 border-t border-[#CCD0CF] bg-slate-50/50 space-y-3 shrink-0">
        <div className="space-y-1.5 text-xs text-[#4A5C6A]">
          <div className="flex justify-between items-center">
            <span>Item Pesanan</span>
            <span className="tabular-nums font-semibold text-[#06141B]">{totalQty} porsi</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Tipe Layanan</span>
            <span className="font-bold text-[#06141B]">
              {orderType === "DINE_IN"
                ? "Dine In"
                : orderType === "TAKE_AWAY"
                  ? "Take Away"
                  : "Delivery"}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-[#CCD0CF]">
            <span className="text-sm font-extrabold text-[#06141B]">Total Tagihan</span>
            <span className="text-lg font-black text-[#06141B] tabular-nums">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full py-3.5 px-4 bg-[#11212D] hover:bg-[#253745] active:bg-[#06141B] active:scale-[0.99] text-white font-extrabold text-sm rounded-full shadow-md shadow-[#11212D]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

export default PosCartPanel;
