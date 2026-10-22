import { Loader2 } from "lucide-react";

export function RouteLoadingFallback() {
  return (
    <div
      className="p-8 flex items-center justify-center text-slate-500 gap-2"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
      <span className="text-xs font-medium">Memuat halaman...</span>
    </div>
  );
}
