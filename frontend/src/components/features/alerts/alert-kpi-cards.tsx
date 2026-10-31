import { AlertTriangle, Eye, CheckCircle2 } from "lucide-react";
import type { AlertListItem } from "@/api/hooks/use-alerts";

interface AlertKpiCardsProps {
  alerts: AlertListItem[];
}

export function AlertKpiCards({ alerts }: AlertKpiCardsProps) {
  const openCount = alerts.filter((a) => a.status === "OPEN").length;
  const acknowledgedCount = alerts.filter((a) => a.status === "ACKNOWLEDGED").length;
  const resolvedCount = alerts.filter((a) => a.status === "RESOLVED").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
      {/* 1. Open Alerts */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-200/80 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-rose-700 tracking-wide uppercase">
            Perlu Tindakan (OPEN)
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {openCount}
          </div>
          <p className="text-[11px] text-slate-500">Margin tergerus di bawah target</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>

      {/* 2. Acknowledged Alerts */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-amber-700 tracking-wide uppercase">
            Sedang Ditinjau
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {acknowledgedCount}
          </div>
          <p className="text-[11px] text-slate-500">Telah ditandai pemilik usaha</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Eye className="w-6 h-6" />
        </div>
      </div>

      {/* 3. Resolved Alerts */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-emerald-700 tracking-wide uppercase">
            Telah Diselesaikan
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {resolvedCount}
          </div>
          <p className="text-[11px] text-slate-500">Harga dinaikkan / pulih</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
