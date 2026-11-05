import { RefreshCw, AlertCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useDashboardSummary } from "@/api/hooks/use-dashboard";
import { DashboardKpiGrid } from "@/components/features/dashboard/dashboard-kpi-grid";
import { DashboardSalesTrendChart } from "@/components/features/dashboard/dashboard-sales-trend-chart";
import { DashboardTopMenus } from "@/components/features/dashboard/dashboard-top-menus";
import { DashboardTopAlerts } from "@/components/features/dashboard/dashboard-top-alerts";
import { DashboardLowestCapacity } from "@/components/features/dashboard/dashboard-lowest-capacity";
import { DashboardRecentSales } from "@/components/features/dashboard/dashboard-recent-sales";
import { DashboardEmptyState } from "@/components/features/dashboard/dashboard-empty-state";
import { formatDate } from "@/lib/format";

export function DashboardPage() {
  const { data: session } = useSession();
  const { data, isPending, isError, error, refetch } = useDashboardSummary();

  const todayStr = formatDate(new Date());

  if (isPending) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        {/* Full-width 7-day trend chart skeleton */}
        <div className="h-72 bg-slate-100 rounded-2xl" />
        {/* Top menus & recent sales side-by-side skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 bg-slate-100 rounded-2xl" />
          <div className="h-72 bg-slate-100 rounded-2xl" />
        </div>
        {/* Alerts & capacity bottlenecks skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-rose-200 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Gagal Memuat Ringkasan Dashboard</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {error instanceof Error
              ? error.message
              : "Terjadi gangguan saat mengambil data ringkasan bisnis."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Bisnis
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Selamat datang kembali,{" "}
            <span className="font-semibold text-slate-800">{session?.user?.name || "Pemilik"}</span>
            . Ringkasan operasional hari ini ({todayStr}).
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Segarkan Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <DashboardKpiGrid summary={data.summary} />

      {/* New business onboarding banner */}
      {data.isNewBusiness && <DashboardEmptyState />}

      {/* 7-Day Sales Trend (Full Width) */}
      <div className="w-full">
        <DashboardSalesTrendChart salesLast7Days={data.salesLast7Days} />
      </div>

      {/* Top Menus & Recent Daily Sales (Side-by-Side below the Trend Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <DashboardTopMenus topMenus={data.topMenus} />
        <DashboardRecentSales sales={data.recentSales} />
      </div>

      {/* Operational Margin Alerts & Capacity Bottlenecks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <DashboardTopAlerts alerts={data.topAlerts} />
        <DashboardLowestCapacity menus={data.lowestCapacityMenus} />
      </div>
    </div>
  );
}

export default DashboardPage;
