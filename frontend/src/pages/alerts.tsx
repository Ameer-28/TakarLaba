import { useState, useMemo } from "react";
import { AlertTriangle, Bell, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAlerts,
  useApplyAlertPrice,
  useAcknowledgeAlert,
  useDismissAlert,
  type AlertListItem,
} from "@/api/hooks/use-alerts";
import { AlertKpiCards } from "@/components/features/alerts/alert-kpi-cards";
import { AlertTabsBar, type AlertTabValue } from "@/components/features/alerts/alert-tabs-bar";
import { AlertCard } from "@/components/features/alerts/alert-card";
import { AlertDetailModal } from "@/components/features/alerts/alert-detail-modal";
import { DismissAlertDialog } from "@/components/features/alerts/dismiss-alert-dialog";
import { formatRupiah } from "@/lib/format";

export function AlertsPage() {
  const [activeTab, setActiveTab] = useState<AlertTabValue>("ALL");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [dismissTarget, setDismissTarget] = useState<AlertListItem | null>(null);

  const { data: alertsData, isPending, isError, refetch } = useAlerts();

  const applyPriceMutation = useApplyAlertPrice();
  const acknowledgeMutation = useAcknowledgeAlert();
  const dismissMutation = useDismissAlert();

  const alerts = useMemo(() => alertsData || [], [alertsData]);

  const counts = useMemo(
    () => ({
      all: alerts.length,
      open: alerts.filter((a) => a.status === "OPEN").length,
      acknowledged: alerts.filter((a) => a.status === "ACKNOWLEDGED").length,
      resolved: alerts.filter((a) => a.status === "RESOLVED").length,
    }),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    if (activeTab === "ALL") return alerts;
    return alerts.filter((a) => a.status === activeTab);
  }, [alerts, activeTab]);

  const handleApplyPrice = async (alert: AlertListItem) => {
    try {
      await applyPriceMutation.mutateAsync(alert.id);
      toast.success(
        `Harga menu "${alert.menu.name}" berhasil dinaikkan ke ${formatRupiah(alert.recommendedPrice)}`
      );
    } catch {
      toast.error(`Gagal menerapkan harga baru untuk "${alert.menu.name}".`);
    }
  };

  const handleAcknowledge = async (alert: AlertListItem) => {
    try {
      await acknowledgeMutation.mutateAsync(alert.id);
      toast.success(`Peringatan untuk menu "${alert.menu.name}" ditandai sedang ditinjau.`);
    } catch {
      toast.error(`Gagal menandai peringatan.`);
    }
  };

  const handleConfirmDismiss = async (alertId: string, note?: string) => {
    try {
      await dismissMutation.mutateAsync({ alertId, note });
      toast.success("Peringatan margin berhasil diabaikan.");
    } catch {
      toast.error("Gagal mengabaikan peringatan.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-rose-600" />
            Pusat Peringatan Margin
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Deteksi otomatis saat kenaikan harga bahan baku menggerus margin menu di bawah target
            bisnis.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* KPI Cards */}
      <AlertKpiCards alerts={alerts} />

      {/* Filter Tabs */}
      <AlertTabsBar activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

      {/* Content Section */}
      {isPending ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Memuat data peringatan margin...
          </p>
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-sm sm:text-base font-bold text-rose-900">Gagal Memuat Peringatan</h2>
          <p className="text-xs text-rose-600 max-w-md mx-auto">
            Terjadi kendala saat mengambil data peringatan margin. Silakan periksa koneksi Anda dan
            coba lagi.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
          >
            Coba Lagi
          </button>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {activeTab === "ALL"
              ? "Tidak Ada Peringatan Margin"
              : activeTab === "OPEN"
                ? "Tidak Ada Peringatan Terbuka"
                : activeTab === "ACKNOWLEDGED"
                  ? "Tidak Ada Peringatan Sedang Ditinjau"
                  : "Belum Ada Peringatan yang Diselesaikan"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {activeTab === "ALL" || activeTab === "OPEN"
              ? "Seluruh menu usaha Anda saat ini memiliki margin di atas atau sama dengan target ambang batas aman."
              : "Peringatan dalam tab ini akan muncul setelah tindakan diambil atau ditandai."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onApplyPrice={handleApplyPrice}
              onAcknowledge={handleAcknowledge}
              onDismiss={(item) => setDismissTarget(item)}
              onViewDetail={(item) => setSelectedAlertId(item.id)}
              isApplying={applyPriceMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AlertDetailModal
        isOpen={Boolean(selectedAlertId)}
        onClose={() => setSelectedAlertId(null)}
        alertId={selectedAlertId}
      />

      <DismissAlertDialog
        isOpen={Boolean(dismissTarget)}
        onClose={() => setDismissTarget(null)}
        alert={dismissTarget}
        onConfirm={handleConfirmDismiss}
        isPending={dismissMutation.isPending}
      />
    </div>
  );
}

export default AlertsPage;
