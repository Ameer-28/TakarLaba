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

interface BottomNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
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

  // Secondary features are active under "Lainnya"
  const isMoreActive = isSalesActive || isAlertsActive || isAnalyticsActive || isSettingsActive;

  // Define navigation items per role
  const ownerNavItems: BottomNavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "ingredients",
      label: "Bahan & Stok",
      path: "/ingredients",
      icon: Package,
    },
    { id: "pos", label: "Kasir POS", path: "/pos", icon: Store },
    {
      id: "menus",
      label: "Menu & Costing",
      path: "/menus",
      icon: UtensilsCrossed,
    },
    { id: "more", label: "Semua Fitur", path: "#more", icon: Grid2X2 },
  ];

  const cashierNavItems: BottomNavItem[] = [
    { id: "pos", label: "Kasir POS", path: "/pos", icon: Store },
    { id: "sales", label: "Riwayat", path: "/sales", icon: Receipt },
    { id: "pos_center", label: "Kasir POS", path: "/pos", icon: Store },
    { id: "sales_alt", label: "Riwayat", path: "/sales", icon: Receipt },
    { id: "logout", label: "Keluar", path: "#logout", icon: LogOut },
  ];

  const items = userRole === "OWNER" ? ownerNavItems : cashierNavItems;

  // Calculate active index (0 to 4)
  let activeIndex = 0;
  if (userRole === "OWNER") {
    if (isDashboardActive) {
      activeIndex = 0;
    } else if (isIngredientsActive) {
      activeIndex = 1;
    } else if (isPosActive) {
      activeIndex = 2;
    } else if (isMenusActive) {
      activeIndex = 3;
    } else if (isMoreActive) {
      activeIndex = 4;
    }
  } else {
    if (isPosActive) {
      activeIndex = 0;
    } else if (isSalesActive) {
      activeIndex = 1;
    }
  }

  const activeItem = items[activeIndex] ?? items[0]!;
  const ActiveIcon = activeItem.icon;

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
      {/* Floating Bottom Bar (Visible only on Mobile & Tablet: < lg) */}
      <nav
        aria-label="Navigasi Bawah Mobile & Tablet"
        className="lg:hidden fixed bottom-3 sm:bottom-4 inset-x-0 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-md sm:max-w-lg select-none"
      >
        <div className="relative flex items-center h-16 bg-white rounded-[32px] border border-slate-200/80 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
          {/* Animated Elevated Bubble Indicator (Matches website theme: #11212D / slate-900) */}
          <div
            className="absolute -top-3.5 z-30 pointer-events-none transition-[left] duration-300 ease-out"
            style={{
              left: `${(activeIndex + 0.5) * 20}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="w-[52px] h-[52px] rounded-full bg-[#11212D] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(17,33,45,0.35)] ring-4 ring-white">
              <ActiveIcon className="w-5.5 h-5.5 text-white transition-transform duration-200" />
            </div>
          </div>

          {/* Animated Active Indicator Dot at the bottom of the active slot */}
          <div
            className="absolute bottom-2 z-20 pointer-events-none transition-[left] duration-300 ease-out"
            style={{
              left: `${(activeIndex + 0.5) * 20}%`,
              transform: "translateX(-50%)",
            }}
          >
            <span className="block w-1.5 h-1.5 rounded-full bg-[#11212D]" />
          </div>

          {/* 5 Interactive Slots */}
          <div className="w-full h-full flex items-center justify-around px-1 z-10">
            {items.map((item, index) => {
              const isSelected = activeIndex === index;
              const Icon = item.icon;

              // Slide-Up Sheet Trigger (Lainnya)
              if (item.id === "more") {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIsMoreMenuOpen(true)}
                    title={item.label}
                    aria-label={item.label}
                    className="w-1/5 h-full flex flex-col items-center justify-center p-2 rounded-2xl transition-all group cursor-pointer relative z-10"
                  >
                    <Icon
                      className={`w-5.5 h-5.5 transition-all duration-200 ${
                        isSelected
                          ? "opacity-0 scale-75"
                          : "text-slate-400 group-hover:text-slate-800"
                      }`}
                    />
                  </button>
                );
              }

              // Logout Action for Cashier
              if (item.id === "logout") {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    title="Keluar Akun"
                    aria-label="Keluar akun"
                    className="w-1/5 h-full flex flex-col items-center justify-center p-2 rounded-2xl transition-all group cursor-pointer relative z-10"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                    ) : (
                      <LogOut className="w-5.5 h-5.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
                    )}
                  </button>
                );
              }

              // Standard Navigation Link (Dashboard, Bahan, POS, Menu)
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={isSelected ? "page" : undefined}
                  className="w-1/5 h-full flex flex-col items-center justify-center p-2 rounded-2xl transition-all group relative z-10"
                >
                  <Icon
                    className={`w-5.5 h-5.5 transition-all duration-200 ${
                      isSelected
                        ? "opacity-0 scale-75"
                        : "text-slate-400 group-hover:text-slate-800"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Modern Slide-Up Menu Sheet (When 5th icon is clicked) */}
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
                  <h3 className="text-base font-extrabold text-[#11212D]">Semua Fitur TakarLaba</h3>
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
                    ? "bg-[#11212D] text-white border-[#11212D] shadow-xs"
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
                    ? "bg-[#11212D] text-white border-[#11212D] shadow-xs"
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
                    ? "bg-[#11212D] text-white border-[#11212D] shadow-xs"
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
                    ? "bg-[#11212D] text-white border-[#11212D] shadow-xs"
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
                <div className="w-8 h-8 rounded-xl bg-[#11212D] text-white font-bold flex items-center justify-center text-xs shrink-0">
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
