import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { signOut, useSession, type UserRole } from "@/lib/auth-client";
import { toast } from "sonner";
import { DemoBanner } from "@/components/shared/demo-banner";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { LogOut, ShieldCheck, Loader2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  NAV_ITEMS,
  filterNavItemsByRole,
  getInitialSidebarCollapsed,
  saveSidebarCollapsed,
} from "./app-shell-nav";

export function AppShell() {
  const { data: session } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return getInitialSidebarCollapsed(window.localStorage);
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        saveSidebarCollapsed(next, window.localStorage);
      }
      return next;
    });
  };

  const userRole = (session?.user?.role as UserRole | undefined) ?? "CASHIER";
  const userName = session?.user?.name || "Pengguna";
  const userEmail = session?.user?.email || "";

  const allowedNavItems = filterNavItemsByRole(NAV_ITEMS, userRole);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success("Berhasil keluar dari TakarLaba");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Gagal keluar. Silakan coba lagi.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Desktop Sidebar (lg: min 1024px) */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-[#CCD0CF] lg:bg-white lg:z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:w-20" : "lg:w-64"
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center border-b border-[#CCD0CF] h-16 transition-all duration-300 ${
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          }`}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Lebarkan sidebar"
              aria-expanded={false}
              title="Lebarkan sidebar"
              className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#CCD0CF]/40 text-[#11212D] hover:bg-[#11212D] hover:text-white border border-[#CCD0CF] transition-all cursor-pointer shadow-2xs group"
            >
              <PanelLeftOpen className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  to="/dashboard"
                  title="TakarLaba Beranda"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-[#11212D] text-[#CCD0CF] shadow-xs shrink-0 hover:bg-[#253745] transition-colors"
                >
                  <ShieldCheck className="w-5 h-5" />
                </Link>
                <div className="min-w-0 truncate">
                  <span className="font-extrabold text-base tracking-tight text-[#06141B] block leading-tight">
                    TakarLaba
                  </span>
                  <span className="text-[10px] font-semibold text-[#4A5C6A] tracking-wide uppercase truncate block">
                    Margin Guard &bull; UMKM
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleCollapse}
                aria-label="Ciutkan sidebar"
                aria-expanded={true}
                title="Ciutkan sidebar"
                className="p-1.5 rounded-xl text-[#4A5C6A] hover:text-[#06141B] hover:bg-[#CCD0CF]/40 transition-colors cursor-pointer shrink-0"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          className={`flex-1 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden ${
            isCollapsed ? "px-2" : "px-3.5"
          }`}
          aria-label="Menu Utama"
        >
          {allowedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex items-center rounded-2xl transition-all relative group ${
                  isCollapsed
                    ? "justify-center w-11 h-11 mx-auto"
                    : "gap-3 px-3.5 py-2.5 text-sm font-medium"
                } ${
                  isActive
                    ? "bg-[#11212D] text-white font-bold shadow-xs border border-[#11212D]"
                    : "text-[#4A5C6A] hover:text-[#06141B] hover:bg-[#CCD0CF]/30"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? "text-[#CCD0CF]" : "text-[#4A5C6A] group-hover:text-[#253745]"
                  }`}
                />
                {!isCollapsed ? (
                  <span className="truncate">{item.label}</span>
                ) : (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#06141B] text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        {!isCollapsed ? (
          <div className="p-4 border-t border-[#CCD0CF] bg-[#CCD0CF]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#11212D] border border-[#253745] text-[#CCD0CF] font-black flex items-center justify-center text-xs shrink-0 shadow-2xs">
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-bold text-[#06141B] truncate">{userName}</p>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      userRole === "OWNER"
                        ? "bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A]/40"
                        : "bg-[#CCD0CF] text-[#11212D] border border-[#9BA8AB]"
                    }`}
                  >
                    {userRole === "OWNER" ? "Pemilik" : "Kasir"}
                  </span>
                </div>
                <p className="text-xs text-[#4A5C6A] truncate">{userEmail}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#4A5C6A] hover:text-rose-700 hover:bg-rose-50 border border-[#CCD0CF] hover:border-rose-200 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
              ) : (
                <LogOut className="w-4 h-4 text-[#4A5C6A] hover:text-rose-600" />
              )}
              <span>Keluar Akun</span>
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-[#CCD0CF] bg-[#CCD0CF]/20 flex flex-col items-center gap-3">
            <div
              title={`${userName} (${userRole === "OWNER" ? "Pemilik" : "Kasir"})`}
              className="w-10 h-10 rounded-full bg-[#11212D] border border-[#253745] text-[#CCD0CF] font-black flex items-center justify-center text-xs shrink-0 shadow-2xs relative group cursor-default"
            >
              {userName.slice(0, 2).toUpperCase()}
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#06141B] text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                <span className="font-bold">{userName}</span> (
                {userRole === "OWNER" ? "Pemilik" : "Kasir"})
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Keluar Akun"
              aria-label="Keluar Akun"
              className="w-10 h-10 flex items-center justify-center text-[#4A5C6A] hover:text-rose-700 hover:bg-rose-50 border border-[#CCD0CF] hover:border-rose-200 rounded-xl transition-colors disabled:opacity-60 cursor-pointer relative group"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
              ) : (
                <LogOut className="w-4 h-4 text-[#4A5C6A] group-hover:text-rose-600" />
              )}
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#06141B] text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                Keluar Akun
              </div>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Top Header (hidden on desktop) */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#CCD0CF] px-4 h-14 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-[#11212D] text-[#CCD0CF]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base text-[#06141B] tracking-tight">TakarLaba</span>
          <span
            className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              userRole === "OWNER"
                ? "bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A]/30"
                : "bg-[#CCD0CF] text-[#11212D]"
            }`}
          >
            {userRole === "OWNER" ? "Pemilik" : "Kasir"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Keluar Akun"
          className="p-1.5 text-[#4A5C6A] hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 min-h-screen flex flex-col bg-white transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <DemoBanner />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Navigation (fixed on mobile 360px up to 1023px) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#CCD0CF] px-2 py-1.5 flex justify-around items-center shadow-lg"
        aria-label="Navigasi Bawah Mobile"
      >
        {allowedNavItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-xl text-[10px] font-medium transition-colors ${
                isActive ? "text-[#11212D] font-extrabold" : "text-[#4A5C6A] hover:text-[#06141B]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 ${isActive ? "text-[#11212D]" : "text-[#9BA8AB]"}`}
              />
              <span className="truncate max-w-[64px]">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
