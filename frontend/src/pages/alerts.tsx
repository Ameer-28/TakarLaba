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
        `Price for "${alert.menu.name}" increased to ${formatRupiah(alert.recommendedPrice)}`
      );
    } catch {
      toast.error(`Failed to apply new price for "${alert.menu.name}".`);
    }
  };

  const handleAcknowledge = async (alert: AlertListItem) => {
    try {
      await acknowledgeMutation.mutateAsync(alert.id);
      toast.success(`Alert for "${alert.menu.name}" marked as acknowledged.`);
    } catch {
      toast.error(`Failed to acknowledge alert.`);
    }
  };

  const handleConfirmDismiss = async (alertId: string, note?: string) => {
    try {
      await dismissMutation.mutateAsync({ alertId, note });
      toast.success("Margin alert dismissed successfully.");
    } catch {
      toast.error("Failed to dismiss alert.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-rose-600" />
            Margin Alerts Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Automatic detection when rising ingredient prices reduce menu margins below business
            targets.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload</span>
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
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Loading margin alerts...</p>
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-sm sm:text-base font-bold text-rose-900">Failed to Load Alerts</h2>
          <p className="text-xs text-rose-600 max-w-md mx-auto">
            An issue occurred while fetching margin alerts. Please check your connection and try
            again.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
          >
            Try Again
          </button>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {activeTab === "ALL"
              ? "No Margin Alerts"
              : activeTab === "OPEN"
                ? "No Open Alerts"
                : activeTab === "ACKNOWLEDGED"
                  ? "No Acknowledged Alerts"
                  : "No Resolved Alerts Yet"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {activeTab === "ALL" || activeTab === "OPEN"
              ? "All of your menu items currently maintain healthy profit margins at or above your safety threshold."
              : "Alerts in this tab will appear once actions are taken or acknowledged."}
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
