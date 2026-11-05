import { useRouteError, isRouteErrorResponse, Link } from "react-router";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export function RouteErrorPage() {
  const error = useRouteError();

  let errorMessage = "Terjadi gangguan saat memuat halaman.";
  let statusText = "Halaman Mengalami Gangguan";

  if (isRouteErrorResponse(error)) {
    statusText = `Kesalahan ${error.status}: ${error.statusText || "Tidak Ditemukan"}`;
    errorMessage = error.data?.message || error.statusText || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div
      className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{statusText}</h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">{errorMessage}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang
          </button>
        </div>
      </div>
    </div>
  );
}
