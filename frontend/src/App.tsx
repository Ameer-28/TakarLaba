import { ShieldCheck, TrendingUp, AlertTriangle, Store } from "lucide-react";

export function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <header className="max-w-2xl w-full text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>TakarLaba Platform Ready</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          TakarLaba
        </h1>
        <p className="text-lg text-slate-600">
          Asisten Penjaga Margin & Anti-Waste untuk UMKM Kuliner Indonesia
        </p>
      </header>

      <main className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-lg text-slate-900">Costing Real-time</h2>
          <p className="text-sm text-slate-500">
            Perhitungan HPP Aktual & Pengganti otomatis dengan akurasi desimal tinggi.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-lg text-slate-900">Price Shock Alert</h2>
          <p className="text-sm text-slate-500">
            Deteksi dini kenaikan harga bahan pokok untuk melindungi margin laba Anda.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-lg text-slate-900">POS Atomik & FEFO</h2>
          <p className="text-sm text-slate-500">
            Pengurangan stok otomatis berbasis tanggal kedaluwarsa pertama (FEFO).
          </p>
        </div>
      </main>

      <footer className="mt-16 text-center text-xs text-slate-400">
        GTNIC 2026 Web Development &bull; TakarLaba Team
      </footer>
    </div>
  );
}

export default App;
