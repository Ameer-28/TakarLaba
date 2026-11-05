import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  UtensilsCrossed,
  AlertCircle,
  Coffee,
  CupSoda,
  Utensils,
  Cake,
} from "lucide-react";
import type { PosMenuItem } from "../../../api/hooks/use-pos-menus.js";
import { formatRupiah } from "../../../lib/format.js";
import type { CartItem, DrinkTemperature } from "./types.js";
import { isBeverageMenu, getDefaultTemperature, formatPosMenuName } from "./pos-utils.js";

interface PosMenuGridProps {
  menus: PosMenuItem[];
  cartItems: CartItem[];
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onSelectCategory: (val: string) => void;
  onAddToCart: (menu: PosMenuItem, temperature?: DrinkTemperature) => void;
  onIncrement?: (menuId: string, temperature?: DrinkTemperature) => void;
  onDecrement?: (menuId: string, temperature?: DrinkTemperature) => void;
  isPending: boolean;
  isError: boolean;
  onRefetch: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

function getMenuIcon(name: string, category: string | null) {
  const text = `${name} ${category ?? ""}`.toLowerCase();
  if (
    text.includes("kopi") ||
    text.includes("coffee") ||
    text.includes("espresso") ||
    text.includes("latte") ||
    text.includes("cappuccino") ||
    text.includes("v60") ||
    text.includes("americano")
  ) {
    return <Coffee className="w-8 h-8 sm:w-10 sm:h-10 text-[#253745]" />;
  }
  if (
    text.includes("teh") ||
    text.includes("tea") ||
    text.includes("jus") ||
    text.includes("juice") ||
    text.includes("soda") ||
    text.includes("minuman") ||
    text.includes("drink") ||
    text.includes("boba") ||
    text.includes("susu") ||
    text.includes("milk")
  ) {
    return <CupSoda className="w-8 h-8 sm:w-10 sm:h-10 text-[#253745]" />;
  }
  if (
    text.includes("snack") ||
    text.includes("roti") ||
    text.includes("cake") ||
    text.includes("dessert") ||
    text.includes("kue") ||
    text.includes("toast") ||
    text.includes("pastry")
  ) {
    return <Cake className="w-8 h-8 sm:w-10 sm:h-10 text-[#253745]" />;
  }
  return <Utensils className="w-8 h-8 sm:w-10 sm:h-10 text-[#253745]" />;
}

export function PosMenuGrid({
  menus,
  cartItems,
  search,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onIncrement,
  onDecrement,
  isPending,
  isError,
  onRefetch,
  searchInputRef,
}: PosMenuGridProps) {
  // Selected temperature for beverages (menuId -> "ICE" | "HOT")
  const [selectedTemperatures, setSelectedTemperatures] = useState<
    Record<string, DrinkTemperature>
  >({});

  // Categories present in catalog
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    menus.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [menus]);

  // Filtered menu list
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = menu.name.toLowerCase().includes(query);
        const matchesCat = menu.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat) return false;
      }

      if (selectedCategory !== "ALL") {
        if (menu.category !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [menus, search, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Search and Category Filter Bar */}
      <div className="space-y-3">
        {/* Rounded-full Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5C6A]" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari menu pesanan..."
            className="w-full pl-11 pr-24 py-3 text-sm bg-white border border-[#CCD0CF] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#253745]/20 focus:border-[#253745] transition-all placeholder:text-[#4A5C6A] shadow-2xs"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 select-none pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#4A5C6A] bg-[#CCD0CF]/20 border border-[#CCD0CF] rounded shadow-2xs">
              F1 / /
            </kbd>
          </div>
        </div>

        {/* Category Pills Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
          <button
            type="button"
            onClick={() => onSelectCategory("ALL")}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-[#11212D] text-white shadow-2xs border border-[#11212D]"
                : "bg-white text-[#4A5C6A] hover:text-[#06141B] border border-[#CCD0CF] hover:border-[#9BA8AB] shadow-2xs"
            }`}
          >
            Semua Menu
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#11212D] text-white shadow-2xs border border-[#11212D]"
                  : "bg-white text-[#4A5C6A] hover:text-[#06141B] border border-[#CCD0CF] hover:border-[#9BA8AB] shadow-2xs"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-extrabold text-[#06141B] text-base sm:text-lg tracking-tight">
          {selectedCategory === "ALL" ? "Daftar Menu" : `Menu ${selectedCategory}`}
        </h3>
        <span className="text-xs font-semibold text-[#4A5C6A] tabular-nums">
          {filteredMenus.length} menu tersedia
        </span>
      </div>

      {/* Menu Cards Grid */}
      {isPending ? (
        <div className="bg-white rounded-3xl border border-[#CCD0CF] p-12 text-center text-[#4A5C6A] space-y-2 shadow-2xs">
          <div className="w-8 h-8 border-3 border-[#11212D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Memuat katalog kasir...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl border border-[#CCD0CF] p-8 text-center space-y-3 shadow-2xs">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-rose-700">Gagal memuat katalog menu</p>
          <button
            type="button"
            onClick={onRefetch}
            className="px-4 py-2 text-xs font-bold text-[#06141B] bg-[#CCD0CF]/40 hover:bg-[#CCD0CF] rounded-full transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#CCD0CF] p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-[#CCD0CF]/40 text-[#253745] rounded-2xl flex items-center justify-center mx-auto border border-[#CCD0CF]">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#06141B]">
            {search || selectedCategory !== "ALL"
              ? "Tidak Ada Menu yang Cocok"
              : "Belum Ada Menu Siap Jual"}
          </h3>
          <p className="text-sm text-[#4A5C6A] max-w-sm mx-auto">
            {search || selectedCategory !== "ALL"
              ? "Coba ubah kata kunci pencarian atau pilih kategori lain."
              : "Tambahkan menu dan susun takaran resep di katalog agar menu dapat dijual di kasir."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMenus.map((menu) => {
            const displayName = formatPosMenuName(menu.name);
            const isDrink = isBeverageMenu(menu.name, menu.category);
            const temperature = isDrink
              ? (selectedTemperatures[menu.id] ?? getDefaultTemperature(menu.name))
              : undefined;

            const currentVariantCartItem = cartItems.find(
              (it) => it.menuId === menu.id && (isDrink ? it.temperature === temperature : true)
            );
            const inCartQty = currentVariantCartItem?.qty ?? 0;
            const totalMenuInCartQty = cartItems
              .filter((it) => it.menuId === menu.id)
              .reduce((sum, it) => sum + it.qty, 0);

            const isSellable = menu.hasRecipe && menu.capacity > 0;

            return (
              <div
                key={menu.id}
                className={`group relative bg-white rounded-3xl border p-4 sm:p-4.5 transition-all flex flex-col justify-between select-none ${
                  isSellable
                    ? "border-[#CCD0CF] hover:border-[#253745] hover:shadow-md"
                    : "border-[#CCD0CF] bg-[#CCD0CF]/20 opacity-65"
                }`}
              >
                {/* Card Top: Thumbnail + Info (Matching Reference Layout) */}
                <div className="flex items-start gap-3.5 sm:gap-4">
                  {/* Left Thumbnail Box */}
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-slate-50 border border-[#CCD0CF]/60 flex items-center justify-center shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform p-2">
                    {getMenuIcon(menu.name, menu.category)}
                    {totalMenuInCartQty > 0 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[10px] font-black bg-[#11212D] text-white rounded-full shadow-2xs">
                        {totalMenuInCartQty}
                      </span>
                    )}
                  </div>

                  {/* Right Details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Top Row: Menu Name (Left) & Price (Right) */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-extrabold text-[#06141B] text-base leading-snug truncate group-hover:text-[#253745] transition-colors">
                        {displayName}
                      </h4>
                      <span className="text-sm sm:text-base font-black text-[#11212D] tabular-nums whitespace-nowrap shrink-0">
                        {formatRupiah(menu.sellingPrice)}
                      </span>
                    </div>

                    {/* Subtitle / Description: Category & Stock info */}
                    <p className="text-xs text-[#4A5C6A] line-clamp-2 leading-relaxed">
                      {menu.category ? `${menu.category} · ` : ""}
                      {menu.capacity === 0 ? (
                        <span className="text-rose-600 font-semibold">Stok habis</span>
                      ) : menu.capacity <= 10 ? (
                        <span className="text-amber-700 font-semibold">
                          Sisa {menu.capacity} porsi
                          {menu.bottleneckIngredientName
                            ? ` (dibatasi ${menu.bottleneckIngredientName})`
                            : ""}
                        </span>
                      ) : (
                        <span>Sisa {menu.capacity} porsi</span>
                      )}
                    </p>

                    {/* Beverage Temperature Selector: Dingin vs Panas */}
                    {isDrink && (
                      <div
                        className="flex items-center gap-2 pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs font-semibold text-[#4A5C6A]">Suhu</span>
                        <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-full border border-[#CCD0CF]/60 select-none">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTemperatures((prev) => ({ ...prev, [menu.id]: "ICE" }));
                            }}
                            className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              temperature === "ICE"
                                ? "bg-[#11212D] text-white shadow-2xs"
                                : "text-[#4A5C6A] hover:text-[#06141B]"
                            }`}
                            title="Pilihan Dingin"
                          >
                            Dingin
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTemperatures((prev) => ({ ...prev, [menu.id]: "HOT" }));
                            }}
                            className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              temperature === "HOT"
                                ? "bg-[#11212D] text-white shadow-2xs"
                                : "text-[#4A5C6A] hover:text-[#06141B]"
                            }`}
                            title="Pilihan Panas"
                          >
                            Panas
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Stepper on Left, Action Button on Right (Matching Reference) */}
                <div className="mt-3.5 pt-3 border-t border-[#CCD0CF]/60 flex items-center justify-between gap-3">
                  {/* Left Stepper: [-] qty [+] */}
                  <div
                    className="inline-flex items-center gap-2 bg-slate-100/90 rounded-full px-2.5 py-1 border border-[#CCD0CF]/60 select-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={!isSellable || inCartQty === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDecrement?.(menu.id, temperature);
                      }}
                      className="w-5 h-5 rounded-full bg-white text-[#11212D] hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-2xs text-xs font-bold cursor-pointer transition-colors"
                      title="Kurang 1"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="tabular-nums font-black text-xs text-[#06141B] min-w-[18px] text-center">
                      {inCartQty}
                    </span>
                    <button
                      type="button"
                      disabled={!isSellable}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (inCartQty === 0) {
                          onAddToCart(menu, temperature);
                        } else {
                          onIncrement?.(menu.id, temperature);
                        }
                      }}
                      className="w-5 h-5 rounded-full bg-white text-[#11212D] hover:bg-[#11212D] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-2xs text-xs font-bold cursor-pointer transition-colors"
                      title="Tambah 1"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Right Action Button: Always "Tambah ke Keranjang" */}
                  {isSellable ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(menu, temperature);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#11212D] hover:bg-[#253745] active:bg-[#06141B] rounded-full shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap ml-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah ke Keranjang</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200/60 ml-auto">
                      Stok Habis
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PosMenuGrid;
