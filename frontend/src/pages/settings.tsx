import { useState } from "react";
import { Layers, Sliders } from "lucide-react";
import { BusinessSettingsForm, OverheadManager } from "../components/features/settings/index.js";

type SettingsTab = "overheads" | "business";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("overheads");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pengaturan Usaha & Overhead
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Kelola beban biaya operasional bulanan untuk perhitungan HPP Penuh dan parameter usaha.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("overheads")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors -mb-px ${
            activeTab === "overheads"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          Beban Overhead Bulanan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("business")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors -mb-px ${
            activeTab === "business"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Parameter & Target Usaha
        </button>
      </div>

      {/* Tab contents */}
      <div>
        {activeTab === "overheads" && <OverheadManager />}
        {activeTab === "business" && <BusinessSettingsForm />}
      </div>
    </div>
  );
}

export default SettingsPage;
