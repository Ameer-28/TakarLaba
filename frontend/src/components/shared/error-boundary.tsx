import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(): void {
    // Unhandled errors are caught safely within this boundary to prevent breaking the app shell
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="p-6 sm:p-8 rounded-2xl bg-white border border-rose-200/80 shadow-xs max-w-lg mx-auto my-8 text-center space-y-5 animate-in fade-in zoom-in-95"
          role="alert"
          aria-live="assertive"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Terjadi Gangguan pada Tampilan
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Sistem mendeteksi kendala saat memuat bagian ini. Data operasional bisnis Anda tetap
              aman di server.
            </p>
          </div>

          {this.state.error?.message && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-mono text-slate-700 text-left overflow-x-auto max-h-24">
              {this.state.error.message}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
