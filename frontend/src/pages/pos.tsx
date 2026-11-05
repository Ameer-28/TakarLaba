import { useState, useReducer, useRef } from "react";
import { ShoppingCart, ArrowRight, X, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { usePosMenus, type PosMenuItem } from "../api/hooks/use-pos-menus.js";
import type { SaleDetail } from "../api/hooks/use-sales.js";
import type { CartItem, DrinkTemperature } from "../components/features/pos/types.js";
import {
  cartReducer,
  initialCartState,
  getCartTotalQty,
  getCartTotalAmount,
} from "../components/features/pos/cart-reducer.js";
import { PosMenuGrid } from "../components/features/pos/pos-menu-grid.js";
import { PosCartPanel } from "../components/features/pos/pos-cart-panel.js";
import { PosCheckoutModal } from "../components/features/pos/pos-checkout-modal.js";
import { ReceiptDialog } from "../components/features/pos/receipt-dialog.js";
import { usePosShortcuts } from "../components/features/pos/use-pos-shortcuts.js";
import { formatPosMenuName } from "../components/features/pos/pos-utils.js";
import { formatRupiah } from "../lib/format.js";

export function PosPage() {
  const [cartState, dispatch] = useReducer(cartReducer, initialCartState);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleDetail | null>(null);
  const [completedCashReceived, setCompletedCashReceived] = useState<number>(0);
  const [completedCartItems, setCompletedCartItems] = useState<CartItem[]>([]);

  // Mobile bottom drawer toggle
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: menus = [], isPending, isError, refetch } = usePosMenus();

  const totalQty = getCartTotalQty(cartState.items);
  const totalAmount = getCartTotalAmount(cartState.items);

  const handleOpenCheckout = () => {
    if (cartState.items.length === 0) {
      toast.error("Keranjang belanja masih kosong");
      return;
    }
    setIsMobileDrawerOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handleClear = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  usePosShortcuts({
    onSearchFocus: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    onOpenCheckout: handleOpenCheckout,
    onClearCart: () => {
      if (cartState.items.length === 0) return;
      handleClear();
      toast.info("Keranjang pesanan telah dikosongkan");
    },
    onCloseModals: () => {
      setIsCheckoutModalOpen(false);
      setIsReceiptModalOpen(false);
      setIsMobileDrawerOpen(false);
    },
    isModalOpen: isCheckoutModalOpen || isReceiptModalOpen || isMobileDrawerOpen,
    hasCartItems: cartState.items.length > 0,
  });

  const handleAddToCart = (menu: PosMenuItem, temperature?: DrinkTemperature) => {
    if (menu.capacity <= 0) {
      toast.error(`Menu "${menu.name}" sedang habis stok`);
      return;
    }
    if (!menu.hasRecipe) {
      toast.error(`Menu "${menu.name}" belum memiliki susunan takaran resep`);
      return;
    }

    dispatch({
      type: "ADD_ITEM",
      payload: {
        menuId: menu.id,
        name: formatPosMenuName(menu.name),
        category: menu.category,
        sellingPrice: parseFloat(menu.sellingPrice),
        temperature,
      },
    });
  };

  const handleIncrement = (cartKeyOrMenuId: string, temperature?: DrinkTemperature) => {
    const key = temperature ? `${cartKeyOrMenuId}-${temperature}` : cartKeyOrMenuId;
    dispatch({ type: "INCREMENT_QTY", payload: { cartKey: key, menuId: cartKeyOrMenuId } });
  };

  const handleDecrement = (cartKeyOrMenuId: string, temperature?: DrinkTemperature) => {
    const key = temperature ? `${cartKeyOrMenuId}-${temperature}` : cartKeyOrMenuId;
    dispatch({ type: "DECREMENT_QTY", payload: { cartKey: key, menuId: cartKeyOrMenuId } });
  };

  const handleRemove = (cartKeyOrMenuId: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      payload: { cartKey: cartKeyOrMenuId, menuId: cartKeyOrMenuId },
    });
  };

  const handleCheckoutSuccess = (sale: SaleDetail, cashReceived: number) => {
    setCompletedCartItems([...cartState.items]);
    dispatch({ type: "CLEAR_CART" });
    setIsCheckoutModalOpen(false);
    setCompletedSale(sale);
    setCompletedCashReceived(cashReceived);
    setIsReceiptModalOpen(true);
    toast.success(`Transaksi ${sale.invoiceNo} berhasil dicatat`);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen w-full">
      {/* Left Column: Menu Catalog Grid */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        <PosMenuGrid
          menus={menus}
          cartItems={cartState.items}
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddToCart={handleAddToCart}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          isPending={isPending}
          isError={isError}
          onRefetch={refetch}
          searchInputRef={searchInputRef}
        />

        {/* Keyboard Shortcuts Hint Bar (Bawah Katalog) */}
        <div className="hidden md:flex items-center justify-center pt-3">
          <div className="inline-flex items-center gap-2 text-xs text-stone-500 bg-white/90 px-4 py-2 rounded-full border border-stone-200/80 shadow-2xs">
            <Keyboard className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-bold text-slate-800">Pintasan:</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-stone-50 border border-stone-200 rounded shadow-2xs font-bold text-stone-600">
                F1 / /
              </kbd>
              <span>Cari</span>
            </span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-stone-50 border border-stone-200 rounded shadow-2xs font-bold text-stone-600">
                F2
              </kbd>
              <span>Bayar</span>
            </span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-stone-50 border border-stone-200 rounded shadow-2xs font-bold text-stone-600">
                F4
              </kbd>
              <span>Kosongkan</span>
            </span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-stone-50 border border-stone-200 rounded shadow-2xs font-bold text-stone-600">
                Esc
              </kbd>
              <span>Batal</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Dedicated Full-Height Cart Panel (Matching Purr'Coffee) */}
      <aside className="hidden lg:flex w-80 xl:w-96 shrink-0 h-screen sticky top-0 bg-white border-l border-[#CCD0CF] flex-col z-10">
        <PosCartPanel
          items={cartState.items}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onRemove={handleRemove}
          onClear={handleClear}
          onCheckout={handleOpenCheckout}
        />
      </aside>

      {/* Mobile Floating Bottom Bar (< lg) */}
      {cartState.items.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom duration-200">
          <div className="bg-slate-900 text-white p-3.5 rounded-3xl shadow-xl flex items-center justify-between border border-slate-800">
            <div
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="relative p-2 bg-slate-800 text-[#CCD0CF] rounded-2xl">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[10px] font-black bg-[#253745] text-[#CCD0CF] rounded-full border border-[#4A5C6A]">
                  {totalQty}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#9BA8AB] block font-medium">Total Pesanan</span>
                <span className="text-base font-black tabular-nums text-white">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCheckout}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#11212D] hover:bg-[#253745] active:bg-[#06141B] text-[#CCD0CF] border border-[#253745] rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Bayar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Drawer Backdrop & Panel (< lg) */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">Rincian Keranjang</h3>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <PosCartPanel
                items={cartState.items}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onRemove={handleRemove}
                onClear={handleClear}
                onCheckout={handleOpenCheckout}
              />
            </div>
          </div>
        </div>
      )}

      {/* Checkout Payment Modal */}
      <PosCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cartItems={cartState.items}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Printable Receipt Dialog */}
      <ReceiptDialog
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={completedSale}
        cashReceived={completedCashReceived}
        cartItems={completedCartItems}
      />
    </div>
  );
}

export default PosPage;
