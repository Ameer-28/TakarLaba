import React, { useState, useEffect } from "react";
import { Save, Loader2, Store, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useSettings, useUpdateSettings } from "../../../api/hooks/use-settings.js";
import { useDemoReset } from "@/api/hooks/use-demo";
import { CustomSelect, type SelectOption } from "@/components/ui/custom-select";

const PRICE_ROUNDING_OPTIONS: SelectOption<number>[] = [
  {
    value: 1,
    label: "No Rounding (Rp1)",
    description: "Exact price calculation without multiple rounding",
  },
  {
    value: 50,
    label: "Rp50 (Multiple of 50)",
    description: "Rounded up to nearest multiple of Rp50",
  },
  {
    value: 100,
    label: "Rp100 (Multiple of 100)",
    description: "Rounded up to nearest multiple of Rp100",
  },
  {
    value: 500,
    label: "Rp500 (Standard Recommendation)",
    description: "Standard recommendation for F&B culinary retail",
    badge: "Recommended",
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
  {
    value: 1000,
    label: "Rp1,000 (Multiple of 1,000)",
    description: "Rounded up to nearest multiple of Rp1,000",
  },
];

export function BusinessSettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const resetDemoMutation = useDemoReset();

  const [name, setName] = useState("");
  const [targetMarginDefault, setTargetMarginDefault] = useState("50");
  const [priceRoundingStep, setPriceRoundingStep] = useState(500);
  const [expectedMonthlyPortions, setExpectedMonthlyPortions] = useState(1000);
  const [expiryWarnDays, setExpiryWarnDays] = useState(3);
  const [timezone, setTimezone] = useState("Asia/Jakarta");

  useEffect(() => {
    if (settings) {
      setName(settings.name);
      setTargetMarginDefault(Math.round(Number(settings.targetMarginDefault)).toString());
      setPriceRoundingStep(settings.priceRoundingStep);
      setExpectedMonthlyPortions(settings.expectedMonthlyPortions);
      setExpiryWarnDays(settings.expiryWarnDays);
      setTimezone(settings.timezone);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetMarginNum = Number(targetMarginDefault);
    if (isNaN(targetMarginNum) || targetMarginNum < 0 || targetMarginNum > 95) {
      toast.error("Target margin must be between 0% and 95%");
      return;
    }

    if (expectedMonthlyPortions < 1) {
      toast.error("Estimated monthly portions must be at least 1");
      return;
    }

    if (expiryWarnDays < 1 || expiryWarnDays > 60) {
      toast.error("Expiry warning must be between 1 and 60 days");
      return;
    }

    try {
      await updateSettings.mutateAsync({
        name: name.trim(),
        targetMarginDefault: targetMarginNum,
        priceRoundingStep,
        expectedMonthlyPortions,
        expiryWarnDays,
        timezone,
      });
      toast.success("Business settings updated successfully");
    } catch {
      toast.error("Failed to save business settings");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
        Loading business settings...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Culinary Business Parameters</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize default margin target, automatic price rounding step, and monthly portion
            target.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Business / Store Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sweet Memories Coffee"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                Default Target Margin (%) <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">Standard 50%</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="95"
                step="1"
                required
                value={targetMarginDefault}
                onChange={(e) => setTargetMarginDefault(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Standard profit margin percentage benchmark for new menus and Price Shock detection.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Selling Price Rounding Step <span className="text-red-500">*</span>
            </label>
            <CustomSelect<number>
              value={priceRoundingStep}
              onChange={setPriceRoundingStep}
              options={PRICE_ROUNDING_OPTIONS}
            />
            <p className="text-xs text-slate-500 mt-1">
              Automatic price suggestions will be rounded up to the nearest multiple.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Estimated Portions Sold per Month <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="1000000"
                required
                value={expectedMonthlyPortions}
                onChange={(e) => setExpectedMonthlyPortions(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                portions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Used as denominator for total monthly costs to calculate overhead allocation per
              portion.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Expiring Soon Warning Threshold <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="60"
                required
                value={expiryWarnDays}
                onChange={(e) => setExpiryWarnDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                days
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ingredients with remaining shelf life below this threshold will be marked with a
              yellow &quot;Expiring Soon&quot; badge.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Operating Timezone
            </label>
            <input
              type="text"
              disabled
              value={timezone}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Standard WIB (Asia/Jakarta) for expiration date
              calculations.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            {updateSettings.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Business Settings
          </button>
        </div>
      </form>

      {settings?.isDemo && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-amber-900">Reset Data Simulasi</h4>
              <p className="text-xs text-amber-700/80 mt-1 max-w-xl">
                Akun ini menggunakan data simulasi untuk evaluasi fitur. Anda dapat mengembalikan seluruh data (stok, riwayat belanja, alert harga, dan transaksi) ke kondisi semula kapan saja.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Apakah Anda yakin ingin mereset seluruh data simulasi ke kondisi awal?")) {
                  resetDemoMutation.mutate();
                }
              }}
              disabled={resetDemoMutation.isPending}
              className="shrink-0 px-4 py-2 bg-white hover:bg-amber-100/80 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              {resetDemoMutation.isPending ? "Mereset..." : "Reset ke Data Awal"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
