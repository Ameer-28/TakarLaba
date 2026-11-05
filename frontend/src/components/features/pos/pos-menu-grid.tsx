import { useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  UtensilsCrossed,
  AlertCircle,
  ShoppingBag,
  SlidersHorizontal,
  Coffee,
  CupSoda,
  Utensils,
  Cake,
} from "lucide-react";
import type { PosMenuItem } from "../../../api/hooks/use-pos-menus.js";
import { formatRupiah } from "../../../lib/format.js";
import type { CartItem } from "./types.js";

interface PosMenuGridProps {
  menus: PosMenuItem[];
  cartItems: CartItem[];
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onSelectCategory: (val: string) => void;
  onAddToCart: (menu: PosMenuItem) => void;
  onIncrement?: (menuId: string) => void;
  onDecrement?: (menuId: string) => void;
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
    return <Coffee className="w-8 h-8 sm:w-10 sm:h-10 text-[#f27238]" />;
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
    return <CupSoda className="w-8 h-8 sm:w-10 sm:h-10 text-[#f27238]" />;
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
    return <Cake className="w-8 h-8 sm:w-10 sm:h-10 text-[#f27238]" />;
  }
  return <Utensils className="w-8 h-8 sm:w-10 sm:h-10 text-[#f27238]" />;
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
  // Categories present in catalog
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    menus.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [menus]);

  // Cart quantity map by menuId
  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) {
      map.set(item.menuId, item.qty);
    }
    return map;
  }, [cartItems]);

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
        {/* Rounded-full Search Bar with Filter Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari menu pesanan..."
              className="w-full pl-11 pr-24 py-3 text-sm bg-white border border-stone-200/90 rounded-full focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#f27238] transition-all placeholder:text-stone-400 shadow-2xs"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 select-none pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-stone-400 bg-stone-50 border border-stone-200 rounded shadow-2xs">
                F1 / /
              </kbd>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (selectedCategory !== "ALL") {
                onSelectCategory("ALL");
              } else if (availableCategories.length > 0 && availableCategories[0]) {
                onSelectCategory(availableCategories[0]);
              }
            }}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-3 rounded-full bg-[#f27238] hover:bg-[#e06129] active:scale-[0.98] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
            title="Saring Kategori Menu"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        {/* Category Pills Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
          <button
            type="button"
            onClick={() => onSelectCategory("ALL")}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-[#f27238] text-white shadow-2xs border border-[#f27238]"
                : "bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:border-orange-200 shadow-2xs"
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
                  ? "bg-[#f27238] text-white shadow-2xs border border-[#f27238]"
                  : "bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:border-orange-200 shadow-2xs"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
          {selectedCategory === "ALL" ? "Daftar Menu" : `Menu ${selectedCategory}`}
        </h3>
        <span className="text-xs font-semibold text-stone-500 tabular-nums">
          {filteredMenus.length} menu tersedia
        </span>
      </div>

      {/* Menu Cards Grid */}
      {isPending ? (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center text-stone-500 space-y-2 shadow-2xs">
          <div className="w-8 h-8 border-3 border-[#f27238] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Memuat katalog kasir...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-8 text-center space-y-3 shadow-2xs">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-rose-700">Gagal memuat katalog menu</p>
          <button
            type="button"
            onClick={onRefetch}
            className="px-4 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-orange-50 text-orange-400 rounded-2xl flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {search || selectedCategory !== "ALL"
              ? "Tidak Ada Menu yang Cocok"
              : "Belum Ada Menu Siap Jual"}
          </h3>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            {search || selectedCategory !== "ALL"
              ? "Coba ubah kata kunci pencarian atau pilih kategori lain."
              : "Tambahkan menu dan susun takaran resep di katalog agar menu dapat dijual di kasir."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMenus.map((menu) => {
            const inCartQty = cartQtyMap.get(menu.id) ?? 0;
            const isSellable = menu.hasRecipe && menu.capacity > 0;

            return (
              <div
                key={menu.id}
                onClick={() => {
                  if (isSellable) {
                    onAddToCart(menu);
                  }
                }}
                className={`group relative bg-white rounded-3xl border p-4.5 transition-all flex flex-col justify-between select-none ${
                  isSellable
                    ? "border-stone-200/80 hover:border-orange-300 hover:shadow-md cursor-pointer active:scale-[0.99]"
                    : "border-stone-200 bg-stone-50/60 opacity-65 cursor-not-allowed"
                }`}
              >
                {/* Card Top: Thumbnail + Info */}
                <div className="flex items-start gap-3.5">
                  {/* Left Thumbnail Box */}
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-orange-50/80 border border-orange-100/70 flex items-center justify-center shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform">
                    {getMenuIcon(menu.name, menu.category)}
                    {inCartQty > 0 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[10px] font-black bg-[#f27238] text-white rounded-full shadow-2xs">
                        {inCartQty}
                      </span>
                    )}
                  </div>

                  {/* Right Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-[#f27238] transition-colors">
                        {menu.name}
                      </h4>
                    </div>

                    <div className="text-base font-black text-[#f27238] tabular-nums mt-0.5">
                      {formatRupiah(menu.sellingPrice)}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {menu.category && (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-stone-100 text-stone-600 rounded-full">
                          {menu.category}
                        </span>
                      )}

                      {menu.capacity === 0 ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                          Habis
                        </span>
                      ) : menu.capacity <= 10 ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 tabular-nums">
                          Sisa {menu.capacity}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-stone-500 tabular-nums">
                          Sisa {menu.capacity}
                        </span>
                      )}
                    </div>

                    {menu.bottleneckIngredientName && menu.capacity <= 10 && (
                      <p className="mt-1 text-[10px] text-stone-400 truncate">
                        Dibatasi: {menu.bottleneckIngredientName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Stepper / Action Controls */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  {isSellable ? (
                    inCartQty > 0 ? (
                      <div className="w-full flex items-center justify-between">
                        {/* Inline Stepper matching Purr'Coffee */}
                        <div
                          className="flex items-center gap-2 bg-stone-100 rounded-full px-2.5 py-1 border border-stone-200/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDecrement?.(menu.id);
                            }}
                            className="w-5 h-5 rounded-full bg-white text-stone-700 hover:text-rose-600 flex items-center justify-center shadow-2xs text-xs font-bold cursor-pointer transition-colors"
                            title="Kurang 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="tabular-nums font-black text-xs text-slate-900 px-1 select-none">
                            {inCartQty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onIncrement?.(menu.id);
                            }}
                            className="w-5 h-5 rounded-full bg-[#f27238] text-white hover:bg-[#e06129] flex items-center justify-center shadow-2xs text-xs font-bold cursor-pointer transition-colors"
                            title="Tambah 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Solid Added to Cart Pill */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-[#f27238] text-white shadow-2xs">
                          <ShoppingBag className="w-3 h-3" />
                          <span>Di Keranjang</span>
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(menu);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-[#f27238] hover:text-white bg-orange-50 hover:bg-[#f27238] border border-orange-200/80 rounded-full transition-all cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah ke Keranjang</span>
                      </button>
                    )
                  ) : (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60 ml-auto">
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
