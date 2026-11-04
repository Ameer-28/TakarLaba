import { Loader2 } from "lucide-react";

export function RouteLoadingFallback() {
  return (
    <div
      className="w-full space-y-6 animate-pulse p-4 sm:p-6"
      role="status"
      aria-live="polite"
      aria-label="Memuat data halaman"
    >
      {/* Top Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-xl" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Memuat konten...</span>
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-slate-100/90 rounded-2xl border border-slate-200/50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-200 rounded-md" />
              <div className="w-7 h-7 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-6 w-32 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Content Table / Grid Skeleton */}
      <div className="h-64 bg-slate-100/80 rounded-2xl border border-slate-200/50 p-6 space-y-4">
        <div className="h-4 w-40 bg-slate-200 rounded-md" />
        <div className="space-y-3 pt-2">
          <div className="h-10 bg-slate-200/70 rounded-xl w-full" />
          <div className="h-10 bg-slate-200/50 rounded-xl w-full" />
          <div className="h-10 bg-slate-200/30 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}
