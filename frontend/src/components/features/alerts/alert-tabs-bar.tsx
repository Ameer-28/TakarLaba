import type { AlertStatus } from "@/api/hooks/use-alerts";

export type AlertTabValue = "ALL" | AlertStatus;

interface AlertTabsBarProps {
  activeTab: AlertTabValue;
  onTabChange: (tab: AlertTabValue) => void;
  counts: {
    all: number;
    open: number;
    acknowledged: number;
    resolved: number;
  };
}

export function AlertTabsBar({ activeTab, onTabChange, counts }: AlertTabsBarProps) {
  const tabs: Array<{ value: AlertTabValue; label: string; count: number; color?: string }> = [
    { value: "ALL", label: "Semua", count: counts.all },
    {
      value: "OPEN",
      label: "Perlu Tindakan",
      count: counts.open,
      color: "text-rose-600 bg-rose-50 border-rose-200",
    },
    {
      value: "ACKNOWLEDGED",
      label: "Ditinjau",
      count: counts.acknowledged,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      value: "RESOLVED",
      label: "Selesai",
      count: counts.resolved,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full tabular-nums font-bold ${
                isActive ? "bg-white/20 text-white" : (tab.color ?? "bg-slate-200 text-slate-700")
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
