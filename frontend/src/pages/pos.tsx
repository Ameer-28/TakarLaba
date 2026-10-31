import { useState, useReducer } from "react";
import { Store, ShoppingCart, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { usePosMenus, type PosMenuItem } from "../api/hooks/use-pos-menus.js";
import type { SaleDetail } from "../api/hooks/use-sales.js";
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
import { formatRupiah } from "../lib/format.js";

export function PosPage() {
  const [cartState, dispatch] = useReducer(cartReducer, initialCartState);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleDetail | null>(null);
  const [completedCashReceived, setCompletedCashReceived] = useState<number>(0);

  // Mobile bottom drawer toggle
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const { data: menus = [], isPending, isError, refetch } = usePosMenus();

  const totalQty = getCartTotalQty(cartState.items);
  const totalAmount = getCartTotalAmount(cartState.items);

  const handleAddToCart = (menu: PosMenuItem) => {
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
        name: menu.name,
        category: menu.category,
        sellingPrice: parseFloat(menu.sellingPrice),
      },
    });
  };

  const handleIncrement = (menuId: string) => {
    dispatch({ type: "INCREMENT_QTY", payload: { menuId } });
  };

  const handleDecrement = (menuId: string) => {
    dispatch({ type: "DECREMENT_QTY", payload: { menuId } });
  };

  const handleRemove = (menuId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { menuId } });
  };

  const handleClear = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const handleOpenCheckout = () => {
    if (cartState.items.length === 0) {
      toast.error("Keranjang belanja masih kosong");
      return;
    }
    setIsMobileDrawerOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handleCheckoutSuccess = (sale: SaleDetail, cashReceived: number) => {
    dispatch({ type: "CLEAR_CART" });
    setIsCheckoutModalOpen(false);
    setCompletedSale(sale);
    setCompletedCashReceived(cashReceived);
    setIsReceiptModalOpen(true);
    toast.success(`Transaksi ${sale.invoiceNo} berhasil dicatat`);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kasir (POS) Atomik
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Penjualan langsung dengan pemotongan stok First-Expired, First-Out (FEFO) otomatis.
          </p>
        </div>
      </div>

      {/* Main Grid: Catalog on left, Cart panel on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Menu Catalog Grid (2 cols on lg) */}
        <div className="lg:col-span-2">
          <PosMenuGrid
            menus={menus}
            cartItems={cartState.items}
            search={search}
            onSearchChange={setSearch}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onAddToCart={handleAddToCart}
            isPending={isPending}
            isError={isError}
            onRefetch={refetch}
          />
        </div>

        {/* Right Column: Desktop Cart Panel (1 col on lg, sticky) */}
        <div className="hidden lg:block lg:col-span-1 sticky top-6">
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

      {/* Mobile Floating Bottom Bar (< lg) */}
      {cartState.items.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom duration-200">
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800">
            <div
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="relative p-2 bg-slate-800 text-emerald-400 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[10px] font-black bg-emerald-600 text-white rounded-full">
                  {totalQty}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Total Pesanan</span>
                <span className="text-base font-black tabular-nums text-white">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCheckout}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
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
      />
    </div>
  );
}

export default PosPage;
