import React, { useState, useEffect } from "react";
import { Save, Loader2, Store, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useSettings, useUpdateSettings } from "../../../api/hooks/use-settings.js";

export function BusinessSettingsForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

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
      toast.error("Target margin harus di antara 0% dan 95%");
      return;
    }

    if (expectedMonthlyPortions < 1) {
      toast.error("Estimasi porsi bulanan minimal 1");
      return;
    }

    if (expiryWarnDays < 1 || expiryWarnDays > 60) {
      toast.error("Peringatan kedaluwarsa antara 1 s.d. 60 hari");
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
      toast.success("Pengaturan usaha berhasil diperbarui");
    } catch {
      toast.error("Gagal menyimpan pengaturan usaha");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
        Memuat pengaturan usaha...
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
          <h2 className="text-lg font-bold text-slate-900">Parameter Usaha Kuliner</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuaikan target margin, step pembulatan harga otomatis, dan target porsi bulanan.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Usaha / Gerai <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kopi Kenangan Manis"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                Target Margin Default (%) <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">Standar 50%</span>
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
              Batas persentase margin keuntungan standar untuk menu baru dan deteksi Price Shock.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Step Pembulatan Harga Jual <span className="text-red-500">*</span>
            </label>
            <select
              value={priceRoundingStep}
              onChange={(e) => setPriceRoundingStep(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value={1}>Tanpa Pembulatan (Rp1)</option>
              <option value={50}>Rp50 (Kelipatan 50)</option>
              <option value={100}>Rp100 (Kelipatan 100)</option>
              <option value={500}>Rp500 (Rekomendasi Standar)</option>
              <option value={1000}>Rp1.000 (Kelipatan seribu)</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Rekomendasi harga otomatis akan dibulatkan ke atas sesuai kelipatan ini.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Estimasi Porsi Terjual per Bulan <span className="text-red-500">*</span>
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
                porsi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Digunakan sebagai pembagi total biaya bulanan untuk menghitung beban overhead per
              porsi.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Batas Peringatan Segera Kedaluwarsa <span className="text-red-500">*</span>
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
                hari
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Bahan dengan sisa umur di bawah batas hari ini akan ditandai dengan badge kuning
              &quot;Segera&quot;.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Zona Waktu Operasional
            </label>
            <input
              type="text"
              disabled
              value={timezone}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Standar WIB (Asia/Jakarta) untuk kalkulasi
              tanggal kedaluwarsa.
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
            Simpan Pengaturan Usaha
          </button>
        </div>
      </form>
    </div>
  );
}
