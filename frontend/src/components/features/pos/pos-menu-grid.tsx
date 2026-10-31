import { useMemo } from "react";
import { Search, Plus, UtensilsCrossed, AlertCircle, ShoppingBag } from "lucide-react";
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
  isPending: boolean;
  isError: boolean;
  onRefetch: () => void;
}

export function PosMenuGrid({
  menus,
  cartItems,
  search,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  isPending,
  isError,
  onRefetch,
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari menu pesanan..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onSelectCategory("ALL")}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-colors cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards Grid */}
      {isPending ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Memuat katalog kasir...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-rose-700">Gagal memuat katalog menu</p>
          <button
            type="button"
            onClick={onRefetch}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {search || selectedCategory !== "ALL"
              ? "Tidak Ada Menu yang Cocok"
              : "Belum Ada Menu Siap Jual"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {search || selectedCategory !== "ALL"
              ? "Coba ubah kata kunci pencarian atau pilih kategori lain."
              : "Tambahkan menu dan susun takaran resep di katalog agar menu dapat dijual di kasir."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
                className={`relative bg-white rounded-2xl border p-4 transition-all flex flex-col justify-between select-none ${
                  isSellable
                    ? "border-slate-200/80 hover:border-emerald-300 hover:shadow-md cursor-pointer group active:scale-[0.99]"
                    : "border-slate-200 bg-slate-50/70 opacity-70 cursor-not-allowed"
                }`}
              >
                {/* Header: Name, Category, In-cart Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-black flex items-center justify-center shrink-0 border border-emerald-100 text-sm">
                      {menu.name.slice(0, 2).toUpperCase()}
                    </div>
                    {inCartQty > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-black bg-emerald-600 text-white rounded-lg shadow-2xs">
                        <ShoppingBag className="w-3 h-3" />
                        <span>{inCartQty}</span>
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mt-2 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {menu.name}
                  </h4>

                  <div className="mt-0.5 flex items-center justify-between">
                    {menu.category ? (
                      <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-md">
                        {menu.category}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Tanpa kategori</span>
                    )}

                    {menu.capacity === 0 ? (
                      <span className="text-[11px] font-bold text-rose-700">Habis</span>
                    ) : menu.capacity <= 10 ? (
                      <span className="text-[11px] font-bold text-amber-700 tabular-nums">
                        Sisa {menu.capacity}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        Sisa {menu.capacity}
                      </span>
                    )}
                  </div>

                  {menu.bottleneckIngredientName && menu.capacity <= 10 && (
                    <p className="mt-1 text-[10px] text-slate-400 truncate">
                      Dibatasi: {menu.bottleneckIngredientName}
                    </p>
                  )}
                </div>

                {/* Footer: Price & Add Button / Disabled reason */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="tabular-nums font-black text-slate-900 text-base">
                    {formatRupiah(menu.sellingPrice)}
                  </div>

                  {isSellable ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(menu);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                      Habis
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
