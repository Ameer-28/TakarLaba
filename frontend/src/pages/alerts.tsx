import { AlertTriangle } from "lucide-react";

export function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pusat Peringatan Margin (Price Shock)
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Deteksi otomatis margin tergerus akibat lonjakan harga bahan baku pasca-pembelian.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Tidak Ada Peringatan Terbuka</h2>
        <p className="text-sm text-slate-500">
          Seluruh margin produk berada di atas ambang batas target bisnis.
        </p>
      </div>
    </div>
  );
}
export default AlertsPage;
