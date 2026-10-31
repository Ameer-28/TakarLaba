import { UtensilsCrossed, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export interface MenuMetrics {
  total: number;
  active: number;
  safeMargin: number;
  warningOrDanger: number;
  incompleteOrNoRecipe: number;
}

interface MenuKpiCardsProps {
  metrics: MenuMetrics;
}

export function MenuKpiCards({ metrics }: MenuKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Menu */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Menu
          </span>
          <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-900 mt-2 tabular-nums">{metrics.total}</p>
        <span className="text-xs text-slate-500 mt-1 block">{metrics.active} menu aktif dijual</span>
      </div>

      {/* Margin Aman */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Margin Aman
          </span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-600 mt-2 tabular-nums">
          {metrics.safeMargin}
        </p>
        <span className="text-xs text-slate-500 mt-1 block">Memenuhi target margin usaha</span>
      </div>

      {/* Margin Perlu Perhatian */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Perlu Perhatian
          </span>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-600 mt-2 tabular-nums">
          {metrics.warningOrDanger}
        </p>
        <span className="text-xs text-slate-500 mt-1 block">Status Waspada atau Bahaya</span>
      </div>

      {/* Perlu Resep / Belum Lengkap */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Perlu Data
          </span>
          <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-black text-sky-700 mt-2 tabular-nums">
          {metrics.incompleteOrNoRecipe}
        </p>
        <span className="text-xs text-slate-500 mt-1 block">Belum ada resep atau nota beli</span>
      </div>
    </div>
  );
}
