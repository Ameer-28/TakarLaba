import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import type { UserRole } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Store,
  Package,
  UtensilsCrossed,
  Grid2X2,
  AlertTriangle,
  BarChart3,
  Settings,
  Receipt,
  X,
  LogOut,
  Loader2,
} from "lucide-react";

interface CurvedBottomNavProps {
  userRole: UserRole;
  userName: string;
  userEmail?: string;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export function CurvedBottomNav({
  userRole,
  userName,
  userEmail,
  onLogout,
  isLoggingOut,
}: CurvedBottomNavProps) {
  const location = useLocation();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const pathname = location.pathname;

  // Active state helpers
  const isPosActive = pathname === "/pos";
  const isDashboardActive = pathname === "/dashboard";
  const isIngredientsActive = pathname.startsWith("/ingredients");
  const isMenusActive = pathname.startsWith("/menus");
  const isSalesActive = pathname.startsWith("/sales");
  const isAlertsActive = pathname.startsWith("/alerts");
  const isAnalyticsActive = pathname.startsWith("/analytics");
  const isSettingsActive = pathname.startsWith("/settings");

  // More menu is considered active if we are on one of the secondary routes
  const isMoreActive = isSalesActive || isAlertsActive || isAnalyticsActive || isSettingsActive;

  // Close sheet on route change
  useEffect(() => {
    setIsMoreMenuOpen(false);
  }, [pathname, location.search]);

  // Handle Escape key to close slide-up sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isMoreMenuOpen]);

  return (
    <>
      {/* Floating Curved Bottom Bar (Visible only on Mobile & Tablet: < lg) */}
      <nav
        aria-label="Navigasi Bawah Melengkung"
        className="lg:hidden fixed bottom-3 sm:bottom-4 inset-x-0 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-md sm:max-w-lg select-none"
      >
        <div className="relative flex items-center h-16 filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.10)]">
          {/* Left Wing */}
          <div className="flex-1 h-full bg-white rounded-l-[32px] flex items-center justify-around px-2 z-10 -mr-px">
            {userRole === "OWNER" ? (
              <>
                {/* 1. Dashboard */}
                <Link
                  to="/dashboard"
                  title="Dashboard"
                  className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all group"
                  aria-current={isDashboardActive ? "page" : undefined}
                >
                  <LayoutDashboard
                    className={`w-5.5 h-5.5 transition-colors ${
                      isDashboardActive
                        ? "text-slate-900"
                        : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  {isDashboardActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1b7e53] mt-1" />
                  )}
                </Link>

                {/* 2. Bahan Baku & Stok */}
                <Link
                  to="/ingredients"
                  title="Bahan Baku & Stok"
                  className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all group"
                  aria-current={isIngredientsActive ? "page" : undefined}
                >
                  <Package
                    className={`w-5.5 h-5.5 transition-colors ${
                      isIngredientsActive
                        ? "text-slate-900"
                        : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  {isIngredientsActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1b7e53] mt-1" />
                  )}
                </Link>
              </>
            ) : (
              <>
                {/* Cashier: POS Shortcut & Sales */}
                <Link
                  to="/pos"
                  title="Kasir"
                  className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all group"
                  aria-current={isPosActive ? "page" : undefined}
                >
                  <Store
                    className={`w-5.5 h-5.5 transition-colors ${
                      isPosActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  {isPosActive && <span className="w-1.5 h-1.5 rounded-full bg-[#1b7e53] mt-1" />}
                </Link>
                <Link
                  to="/sales"
                  title="Riwayat Penjualan"
                  className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all group"
                  aria-current={isSalesActive ? "page" : undefined}
                >
                  <Receipt
                    className={`w-5.5 h-5.5 transition-colors ${
                      isSalesActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  {isSalesActive && <span className="w-1.5 h-1.5 rounded-full bg-[#1b7e53] mt-1" />}
                </Link>
              </>
            )}
          </div>

          {/* Center Scoop Cutout Piece */}
          <div className="w-[112px] h-16 relative shrink-0 flex items-center justify-center z-10">
            {/* Seamless SVG scoop path matching reference curve */}
            <svg
              viewBox="0 0 112 64"
              className="w-[112px] h-[64px] block shrink-0"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M 0 0 L 12 0 C 26 0 26 42 56 42 C 86 42 86 0 100 0 L 112 0 L 112 64 L 0 64 Z"
                fill="#ffffff"
              />
            </svg>

            {/* Elevated Primary Action: Kasir (POS) Emerald Circle */}
            <Link
              to="/pos"
              title="Kasir (POS)"
              className="absolute left-1/2 -translate-x-1/2 -top-3.5 w-[52px] h-[52px] rounded-full bg-[#1b7e53] hover:bg-[#156743] active:scale-95 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(27,126,83,0.38)] transition-all z-20 group"
              aria-current={isPosActive ? "page" : undefined}
            >
              <Store className="w-6 h-6 transition-transform group-hover:scale-110" />
            </Link>

            {/* Active Indicator Dot under Center Dip (matching reference) */}
            {isPosActive && (
              <span
                className="absolute left-1/2 -translate-x-1/2 bottom-[9px] w-1.5 h-1.5 rounded-full bg-[#1b7e53] z-10"
                aria-hidden="true"
              />
            )}
          </div>

          {/* Right Wing */}
          <div className="flex-1 h-full bg-white rounded-r-[32px] flex items-center justify-around px-2 z-10 -ml-px">
            {userRole === "OWNER" ? (
              <>
                {/* 3. Menu & Costing */}
                <Link
                  to="/menus"
                  title="Menu & Costing"
                  className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all group"
                  aria-current={isMenusActive ? "page" : undefined}
                >
                  <UtensilsCrossed
                    className={`w-5.5 h-5.5 transition-colors ${
                      isMenusActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  {isMenusActive && <span className="w-1.5 h-1.5 rounded-full bg-[#1b7e53] mt-1" />}
                </Link>

                {/* 4. Semua Menu / Fitur Lainnya (Sheet Trigger) */}
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen(true)}
                  title="Semua Fitur Menu"
                  aria-label="Buka semua fitur menu"
                  className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all group cursor-pointer"
                >
                  <Grid2X2
                    className={`w-5.5 h-5.5 transition-colors ${
                      isMoreActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  {isMoreActive && <span className="w-1.5 h-1.5 rounded-full bg-[#1b7e53] mt-1" />}
                </button>
              </>
            ) : (
              <>
                {/* Cashier: Riwayat Penjualan & Logout */}
                <Link
                  to="/sales"
                  title="Riwayat"
                  className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all group"
                  aria-current={isSalesActive ? "page" : undefined}
                >
                  <Receipt
                    className={`w-5.5 h-5.5 transition-colors ${
                      isSalesActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  {isSalesActive && <span className="w-1.5 h-1.5 rounded-full bg-[#1b7e53] mt-1" />}
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={isLoggingOut}
                  title="Keluar Akun"
                  aria-label="Keluar akun"
                  className="flex flex-col items-center justify-center p-2 rounded-2xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                  ) : (
                    <LogOut className="w-5.5 h-5.5" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Modern Slide-Up Menu Sheet (When 4th icon is clicked) */}
      {isMoreMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMoreMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Panel */}
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl p-5 pb-8 space-y-4 z-10 animate-in slide-in-from-bottom duration-250">
            {/* Sheet Handle & Header */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-3" />
              <div className="w-full flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Semua Fitur TakarLaba</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Pilih menu operasional & analitik
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Tutup menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Grid of Remaining Features */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Peringatan Margin */}
              <Link
                to="/alerts"
                onClick={() => setIsMoreMenuOpen(false)}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  isAlertsActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isAlertsActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">Peringatan Margin</p>
                  <p
                    className={`text-[10px] truncate ${
                      isAlertsActive ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    Deteksi price shock
                  </p>
                </div>
              </Link>

              {/* Riwayat Penjualan */}
              <Link
                to="/sales"
                onClick={() => setIsMoreMenuOpen(false)}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  isSalesActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSalesActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">Riwayat Penjualan</p>
                  <p
                    className={`text-[10px] truncate ${
                      isSalesActive ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    Laporan transaksi
                  </p>
                </div>
              </Link>

              {/* Analitik Menu */}
              <Link
                to="/analytics"
                onClick={() => setIsMoreMenuOpen(false)}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  isAnalyticsActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isAnalyticsActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">Analitik Menu</p>
                  <p
                    className={`text-[10px] truncate ${
                      isAnalyticsActive ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    Matriks kuadran
                  </p>
                </div>
              </Link>

              {/* Pengaturan */}
              <Link
                to="/settings"
                onClick={() => setIsMoreMenuOpen(false)}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  isSettingsActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSettingsActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">Pengaturan</p>
                  <p
                    className={`text-[10px] truncate ${
                      isSettingsActive ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    Biaya & profil usaha
                  </p>
                </div>
              </Link>
            </div>

            {/* Quick Tabs in Bahan Baku */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Akses Cepat Stok
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <Link
                  to="/ingredients?tab=stock"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="px-2 py-1.5 bg-white border border-slate-200/70 rounded-xl text-[11px] font-semibold text-slate-700 hover:border-slate-400 transition-colors"
                >
                  Stok & FEFO
                </Link>
                <Link
                  to="/ingredients?tab=history"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="px-2 py-1.5 bg-white border border-slate-200/70 rounded-xl text-[11px] font-semibold text-slate-700 hover:border-slate-400 transition-colors"
                >
                  Nota Belanja
                </Link>
                <Link
                  to="/ingredients?tab=radar"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="px-2 py-1.5 bg-white border border-slate-200/70 rounded-xl text-[11px] font-semibold text-slate-700 hover:border-slate-400 transition-colors"
                >
                  Waste Radar
                </Link>
              </div>
            </div>

            {/* User Info & Logout inside Sheet */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {userEmail || (userRole === "OWNER" ? "Pemilik" : "Kasir")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
