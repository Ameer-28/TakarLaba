import { Settings } from "lucide-react";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pengaturan Usaha & Overhead
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Konfigurasi target margin default, step pembulatan harga, estimasi porsi bulanan, dan
          beban overhead operasional.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <Settings className="w-10 h-10 text-slate-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Pengaturan Bisnis</h2>
        <p className="text-sm text-slate-500">
          Konfigurasi parameter bisnis dan biaya overhead akan aktif pada Fase 3.
        </p>
      </div>
    </div>
  );
}
export default SettingsPage;
