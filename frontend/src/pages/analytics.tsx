import { BarChart3 } from "lucide-react";

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Analitik Menu Engineering
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Matriks popularitas vs margin kontribusi (Stars, Plowhorses, Puzzles, Dogs) serta analisis
          bottleneck.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <BarChart3 className="w-10 h-10 text-indigo-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Matriks Menu Engineering</h2>
        <p className="text-sm text-slate-500">
          Visualisasi scatter plot Recharts akan aktif pada Fase 6.
        </p>
      </div>
    </div>
  );
}
export default AnalyticsPage;
