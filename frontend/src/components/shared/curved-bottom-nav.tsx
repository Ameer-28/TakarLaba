import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import type { UserRole } from "@/lib/auth-client";
import { X, LogOut, Loader2, AlertTriangle, Receipt, BarChart3, Settings } from "lucide-react";
import {
  OWNER_MOBILE_NAV_ITEMS,
  CASHIER_MOBILE_NAV_ITEMS,
  OWNER_TABLET_NAV_ITEMS,
  CASHIER_TABLET_NAV_ITEMS,
  getMobileActiveIndex,
  getTabletActiveIndex,
} from "./curved-bottom-nav-config";

export interface CurvedBottomNavProps {
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
  const isSalesActive = pathname.startsWith("/sales");
  const isAlertsActive = pathname.startsWith("/alerts");
  const isAnalyticsActive = pathname.startsWith("/analytics");
  const isSettingsActive = pathname.startsWith("/settings");

  // Items per role
  const mobileItems = userRole === "OWNER" ? OWNER_MOBILE_NAV_ITEMS : CASHIER_MOBILE_NAV_ITEMS;
  const tabletItems = userRole === "OWNER" ? OWNER_TABLET_NAV_ITEMS : CASHIER_TABLET_NAV_ITEMS;

  // Active indices
  const mobileActiveIndex = getMobileActiveIndex(pathname, userRole);
  const tabletActiveIndex = getTabletActiveIndex(pathname, userRole);

  const mobileActiveItem = mobileItems[mobileActiveIndex] ?? mobileItems[0]!;
  const MobileActiveIcon = mobileActiveItem.icon;

  const tabletActiveItem = tabletItems[tabletActiveIndex] ?? tabletItems[0]!;
  const TabletActiveIcon = tabletActiveItem.icon;

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
      {/* 1. Mobile Floating Curved Bottom Bar (Visible only on Mobile: < md) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-3 sm:bottom-4 inset-x-0 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-md select-none"
      >
        <div className="relative flex items-center h-16 bg-white rounded-[32px] border border-slate-200/80 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
          {/* Animated Elevated Bubble Indicator */}
          <div
            className="absolute -top-3.5 z-30 pointer-events-none transition-[left] duration-300 ease-out"
            style={{
              left: `${(mobileActiveIndex + 0.5) * 20}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="w-[52px] h-[52px] rounded-full bg-[#11212D] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(17,33,45,0.35)] ring-4 ring-white">
              <MobileActiveIcon className="w-5.5 h-5.5 text-white transition-transform duration-200" />
            </div>
          </div>

          {/* Animated Active Indicator Dot */}
          <div
            className="absolute bottom-2 z-20 pointer-events-none transition-[left] duration-300 ease-out"
            style={{
              left: `${(mobileActiveIndex + 0.5) * 20}%`,
              transform: "translateX(-50%)",
            }}
          >
            <span className="block w-1.5 h-1.5 rounded-full bg-[#11212D]" />
          </div>

          {/* 5 Interactive Slots */}
          <div className="w-full h-full flex items-center justify-around px-1 z-10">
            {mobileItems.map((item, index) => {
              const isSelected = mobileActiveIndex === index;
              const Icon = item.icon;

              // Slide-Up Sheet Trigger (Semua Fitur)
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
                    title="Sign Out"
                    aria-label="Sign out"
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

              // Standard Navigation Link
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

      {/* 2. Tablet Floating Bottom Bar (Visible on Tablet: md <= width < lg) */}
      {/* Displays all available menus directly without needing the rightmost sheet trigger */}
      <nav
        aria-label="Tablet Bottom Navigation"
        className={`hidden md:block lg:hidden fixed bottom-4 inset-x-0 z-40 mx-auto w-[calc(100%-2rem)] select-none ${
          userRole === "OWNER" ? "max-w-3xl" : "max-w-md"
        }`}
      >
        <div className="relative flex items-center h-[4.25rem] bg-white rounded-[32px] border border-slate-200/80 shadow-[0_12px_28px_rgba(0,0,0,0.08)] px-2">
          {/* Animated Elevated Bubble Indicator */}
          <div
            className="absolute -top-3.5 z-30 pointer-events-none transition-[left] duration-300 ease-out"
            style={{
              left: `${(tabletActiveIndex + 0.5) * (100 / tabletItems.length)}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="w-12 h-12 rounded-full bg-[#11212D] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(17,33,45,0.35)] ring-4 ring-white">
              <TabletActiveIcon className="w-5 h-5 text-white transition-transform duration-200" />
            </div>
          </div>

          {/* Animated Active Indicator Dot */}
          <div
            className="absolute bottom-1.5 z-20 pointer-events-none transition-[left] duration-300 ease-out"
            style={{
              left: `${(tabletActiveIndex + 0.5) * (100 / tabletItems.length)}%`,
              transform: "translateX(-50%)",
            }}
          >
            <span className="block w-1.5 h-1.5 rounded-full bg-[#11212D]" />
          </div>

          {/* All Interactive Menu Slots for Tablet */}
          <div className="w-full h-full flex items-center justify-between z-10">
            {tabletItems.map((item, index) => {
              const isSelected = tabletActiveIndex === index;
              const Icon = item.icon;

              if (item.id === "logout") {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    title="Sign Out"
                    aria-label="Sign out"
                    className="flex-1 h-full flex flex-col items-center justify-center pt-2 pb-1.5 px-0.5 rounded-2xl transition-all group cursor-pointer relative z-10"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                    ) : (
                      <LogOut
                        className={`w-5 h-5 transition-all duration-200 ${
                          isSelected
                            ? "opacity-0 scale-75"
                            : "text-slate-400 group-hover:text-rose-600"
                        }`}
                      />
                    )}
                    <span
                      className={`text-[10px] leading-tight truncate transition-colors duration-200 mt-1 ${
                        isSelected
                          ? "font-bold text-[#11212D]"
                          : "font-semibold text-slate-400 group-hover:text-rose-600"
                      }`}
                    >
                      {item.shortLabel ?? item.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={isSelected ? "page" : undefined}
                  className="flex-1 h-full flex flex-col items-center justify-center pt-2 pb-1.5 px-0.5 rounded-2xl transition-all group relative z-10"
                >
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isSelected
                        ? "opacity-0 scale-75"
                        : "text-slate-400 group-hover:text-slate-800"
                    }`}
                  />
                  <span
                    className={`text-[10px] leading-tight truncate transition-colors duration-200 mt-1 ${
                      isSelected
                        ? "font-bold text-[#11212D]"
                        : "font-semibold text-slate-400 group-hover:text-slate-700"
                    }`}
                  >
                    {item.shortLabel ?? item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 3. Modern Slide-Up Menu Sheet (Only on Mobile: md:hidden) */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
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
                  <h3 className="text-base font-extrabold text-[#11212D]">
                    All TakarLaba Features
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Select operational & analytical menus
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Grid of Remaining Features */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Margin Alerts */}
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
                  <p className="text-xs font-bold truncate">Margin Alerts</p>
                  <p
                    className={`text-[10px] truncate ${
                      isAlertsActive ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    Price shock detection
                  </p>
                </div>
              </Link>

              {/* Sales History */}
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
                  <p className="text-xs font-bold truncate">Sales History</p>
                  <p
                    className={`text-[10px] truncate ${
                      isSalesActive ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    Transaction reports
                  </p>
                </div>
              </Link>

              {/* Menu Analytics */}
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
                  <p className="text-xs font-bold truncate">Menu Analytics</p>
                  <p
                    className={`text-[10px] truncate ${
                      isAnalyticsActive ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    Quadrant matrix
                  </p>
                </div>
              </Link>

              {/* Settings */}
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
                  <p className="text-xs font-bold truncate">Settings</p>
                  <p
                    className={`text-[10px] truncate ${
                      isSettingsActive ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    Costs & business profile
                  </p>
                </div>
              </Link>
            </div>

            {/* Quick Tabs in Ingredients */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Quick Stock Access
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <Link
                  to="/ingredients?tab=stock"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="px-2 py-1.5 bg-white border border-slate-200/70 rounded-xl text-[11px] font-semibold text-slate-700 hover:border-slate-400 transition-colors"
                >
                  Stock & FEFO
                </Link>
                <Link
                  to="/ingredients?tab=history"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="px-2 py-1.5 bg-white border border-slate-200/70 rounded-xl text-[11px] font-semibold text-slate-700 hover:border-slate-400 transition-colors"
                >
                  Invoices
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
                    {userEmail || (userRole === "OWNER" ? "Owner" : "Cashier")}
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
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
