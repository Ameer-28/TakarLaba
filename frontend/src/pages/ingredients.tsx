import { Package } from "lucide-react";

export function IngredientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Bahan Baku & Stok
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Kelola master bahan baku kuliner, satuan beli, yield persen, dan stok batch FEFO.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <Package className="w-10 h-10 text-emerald-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Master Bahan Baku</h2>
        <p className="text-sm text-slate-500">
          Modul pengelolaan bahan baku akan aktif pada Fase 2.
        </p>
      </div>
    </div>
  );
}
export default IngredientsPage;
