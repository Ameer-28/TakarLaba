import { Link } from "react-router";
import { Sparkles, ShoppingBag, UtensilsCrossed, Store, ArrowRight } from "lucide-react";

export function DashboardEmptyState() {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-emerald-50/50 via-white to-blue-50/30 border border-emerald-100 shadow-xs space-y-6">
      <div className="max-w-xl space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Selamat Datang di TakarLaba
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Mulai Lindungi Margin Bisnis Kuliner Anda
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          TakarLaba membantu Anda memantau HPP secara otomatis, mendeteksi kenaikan harga bahan baku
          sebelum margin bocor, dan mencegah pemborosan stok dengan sistem FEFO. Ikuti 3 langkah
          mudah di bawah ini:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <Link
          to="/purchases"
          className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-105 transition">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Langkah 1
            </span>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition flex items-center justify-between">
              Input Belanja Bahan
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
            </h3>
            <p className="text-xs text-slate-500">
              Catat nota belanja dan tanggal kedaluwarsa untuk mengaktifkan stok batch dan
              replacement cost.
            </p>
          </div>
        </Link>

        {/* Step 2 */}
        <Link
          to="/menus"
          className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm transition space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold group-hover:scale-105 transition">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Langkah 2
            </span>
            <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition flex items-center justify-between">
              Susun Resep Menu
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
            </h3>
            <p className="text-xs text-slate-500">
              Tautkan bahan dan takaran per porsi agar HPP Bahan & HPP Penuh terhitung otomatis.
            </p>
          </div>
        </Link>

        {/* Step 3 */}
        <Link
          to="/pos"
          className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-sm transition space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold group-hover:scale-105 transition">
            <Store className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
              Langkah 3
            </span>
            <h3 className="font-bold text-slate-900 group-hover:text-purple-700 transition flex items-center justify-between">
              Buka Layar POS
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
            </h3>
            <p className="text-xs text-slate-500">
              Layani penjualan cepat di kasir. Stok akan terpotong secara FEFO dan laba tercatat
              real-time.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
