import { UtensilsCrossed } from "lucide-react";

export function MenusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Menu & Costing Resep
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Kalkulasi HPP Aktual & Pengganti otomatis, penetapan harga jual, dan margin kontribusi.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <UtensilsCrossed className="w-10 h-10 text-emerald-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Katalog Menu & Resep</h2>
        <p className="text-sm text-slate-500">
          Kalkulasi costing live dengan debounce akan diimplementasikan pada Fase 3.
        </p>
      </div>
    </div>
  );
}
export default MenusPage;
