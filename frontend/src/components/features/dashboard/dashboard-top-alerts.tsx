import { Link } from "react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { useApplyAlertPrice } from "@/api/hooks/use-alerts";
import { toast } from "sonner";
import type { DashboardSummaryData } from "@/api/hooks/use-dashboard";

interface DashboardTopAlertsProps {
  alerts: DashboardSummaryData["topAlerts"];
}

export function DashboardTopAlerts({ alerts }: DashboardTopAlertsProps) {
  const applyPriceMutation = useApplyAlertPrice();

  const handleApplyPrice = (alertId: string, menuName: string, recommendedPrice: string) => {
    applyPriceMutation.mutate(alertId, {
      onSuccess: () => {
        toast.success(
          `Harga menu "${menuName}" berhasil dinaikkan ke ${formatRupiah(recommendedPrice)}`
        );
      },
      onError: (err) => {
        toast.error(`Gagal menerapkan harga rekomendasi: ${err.message}`);
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
            Peringatan Margin Teratas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Menu terdampak lonjakan harga beli yang perlu penyesuaian
          </p>
        </div>
        <Link
          to="/alerts"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
        >
          Lihat Semua
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-800">Margin Semua Menu Aman</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Tidak ada menu dengan margin di bawah target bisnis saat ini.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{alert.menuName}</span>
                  {alert.category && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      {alert.category}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      alert.status === "OPEN"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {alert.status === "OPEN" ? "Perlu Tindakan" : "Ditinjau"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-600">
                  <span>
                    Margin:{" "}
                    <span className="text-slate-400 line-through tabular-nums">
                      {alert.marginBeforePct}%
                    </span>{" "}
                    →{" "}
                    <strong className="text-rose-600 tabular-nums">{alert.marginAfterPct}%</strong>{" "}
                    (Target: {alert.targetPct}%)
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    Rekomendasi Opsi A:{" "}
                    <strong className="text-emerald-700 tabular-nums">
                      {formatRupiah(alert.recommendedPrice)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link
                  to="/alerts"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Detail
                </Link>
                <button
                  type="button"
                  onClick={() => handleApplyPrice(alert.id, alert.menuName, alert.recommendedPrice)}
                  disabled={applyPriceMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition disabled:opacity-50 shadow-xs"
                >
                  {applyPriceMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                  Terapkan Harga
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
