import { Link } from "react-router";
import { Compass, Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-2xs">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            Error 404
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau tautan yang dimasukkan
            salah.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
