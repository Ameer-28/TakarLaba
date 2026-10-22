import { Receipt } from "lucide-react";

export function SalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Riwayat Penjualan
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Daftar seluruh transaksi kasir dan detail alokasi bahan FEFO.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Belum Ada Transaksi</h2>
        <p className="text-sm text-slate-500">
          Transaksi yang tercatat di kasir akan muncul di sini.
        </p>
      </div>
    </div>
  );
}
export default SalesPage;
