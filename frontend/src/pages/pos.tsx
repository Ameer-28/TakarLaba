import { Store } from "lucide-react";

export function PosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kasir (POS) Atomik
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Penjualan langsung dengan alokasi stok First-Expired, First-Out (FEFO) otomatis.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Modul Kasir Siap Dikonfigurasi</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Katalog menu dan keranjang belanja atomik akan aktif setelah bahan baku dan menu
          didaftarkan pada Fase 2 & Fase 4.
        </p>
      </div>
    </div>
  );
}
export default PosPage;
