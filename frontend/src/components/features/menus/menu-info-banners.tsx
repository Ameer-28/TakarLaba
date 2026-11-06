import { Sparkles, Info } from "lucide-react";

export function MenuInfoBanners() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 space-y-1">
          <p className="font-bold">Ingredient Cost vs Full Cost / HPP (BR-04)</p>
          <p className="text-emerald-900 leading-relaxed">
            <strong>Ingredient Cost</strong> calculates raw ingredient costs based on recent
            purchase invoices (replacement cost). <strong>Full Cost (HPP)</strong> adds an allocated
            overhead cost per portion to protect your net margins against rent, utilities, and
            wages.
          </p>
        </div>
      </div>

      <div className="bg-sky-50/70 border border-sky-200/70 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-xs text-sky-950 space-y-1">
          <p className="font-bold">Margin Safety Thresholds (BR-09)</p>
          <p className="text-sky-900 leading-relaxed">
            <span className="font-semibold text-emerald-700">Safe</span> when profit margin meets or
            exceeds your business target.{" "}
            <span className="font-semibold text-amber-700">Warning</span> when within 5 pp below
            target. <span className="font-semibold text-rose-700">Critical</span> when falling more
            than 5 pp below target.
          </p>
        </div>
      </div>
    </div>
  );
}
