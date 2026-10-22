import { TrendingUp, AlertTriangle, Store, UtensilsCrossed } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Dashboard Bisnis
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Selamat datang kembali,{" "}
          <span className="font-semibold">{session?.user?.name || "Pemilik"}</span>. Pantau margin
          laba & peringatan bahan hari ini.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Omzet Hari Ini</span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900">Rp0</p>
          <p className="text-xs text-slate-400">0 transaksi tercatat</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Margin Rata-rata</span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Store className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900">0,0%</p>
          <p className="text-xs text-slate-400">Target bisnis: 50,0%</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Peringatan Margin
            </span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-emerald-600">0 Menu</p>
          <p className="text-xs text-slate-400">Semua margin menu dalam batas aman</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Menu Aktif</span>
            <span className="p-2 bg-purple-50 text-purple-700 rounded-lg">
              <UtensilsCrossed className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900">0 Item</p>
          <p className="text-xs text-slate-400">Siap dijual di POS</p>
        </div>
      </div>
    </div>
  );
}
export default DashboardPage;
