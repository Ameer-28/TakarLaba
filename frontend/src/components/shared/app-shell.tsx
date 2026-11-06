import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { signOut, useSession, type UserRole } from "@/lib/auth-client";
import { toast } from "sonner";
import { DemoBanner } from "@/components/shared/demo-banner";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useClickOutside } from "@/components/ui/use-click-outside";
import { LogOut, Loader2, ChevronLeft, ChevronRight, ChevronDown, Menu, X } from "lucide-react";
import {
  NAV_ITEMS,
  filterNavItemsByRole,
  getInitialSidebarCollapsed,
  saveSidebarCollapsed,
  getNavShortLabel,
  type NavItem,
} from "./app-shell-nav";

export function AppShell() {
  const { data: session } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isIngredientsTreeOpen, setIsIngredientsTreeOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const activeNavRef = useRef<HTMLAnchorElement>(null);

  useClickOutside(profileMenuRef, () => {
    setIsProfileMenuOpen(false);
  });

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname, location.search]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileDrawerOpen(false);
      }
    };
    if (isMobileDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isMobileDrawerOpen]);

  // Scroll active tab into view in mobile bottom nav bar
  useEffect(() => {
    if (activeNavRef.current && typeof activeNavRef.current.scrollIntoView === "function") {
      activeNavRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [location.pathname]);

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

  const isCurrentActive = (item: NavItem) => {
    return location.pathname === item.path;
  };

  const isChildActive = (childPath: string) => {
    const currentFull = `${location.pathname}${location.search}`;
    if (currentFull === childPath) return true;
    if (
      childPath === "/ingredients?tab=catalog" &&
      location.pathname === "/ingredients" &&
      (!location.search || location.search === "?tab=catalog")
    ) {
      return true;
    }
    return false;
  };

  // Reusable nav item renderer for clean maintenance
  const renderItem = (item: NavItem, forceExpanded = false) => {
    const isActive = isCurrentActive(item);
    const Icon = item.icon;
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isItemExpanded = forceExpanded ? true : !isCollapsed;

    // Tree dropdown for items with children (Bahan Baku & Stok) in expanded mode
    if (hasChildren && isItemExpanded) {
      return (
        <div key={item.path} className="space-y-0.5">
          <button
            type="button"
            onClick={() => setIsIngredientsTreeOpen((prev) => !prev)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              isActive || isIngredientsTreeOpen
                ? "bg-slate-100/90 text-slate-900 font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon
                className={`w-4 h-4 ${
                  isActive || isIngredientsTreeOpen ? "text-slate-900" : "text-slate-400"
                }`}
              />
              <span>{item.label}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isIngredientsTreeOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Tree branch connector lines matching reference */}
          {isIngredientsTreeOpen && (
            <div className="relative space-y-0">
              {item.children?.map((child, index) => {
                const childActive = isChildActive(child.path);
                const isLast = index === (item.children?.length ?? 0) - 1;

                return (
                  <div key={child.label} className="relative flex items-center h-8.5">
                    {/* Tree Branch Connector SVG matching reference */}
                    <svg
                      className="absolute left-0 top-0 w-8.5 h-full pointer-events-none text-slate-300"
                      viewBox="0 0 34 34"
                      fill="none"
                    >
                      {!isLast ? (
                        <path
                          d="M 20 0 V 34 M 20 7 Q 20 17 30 17 H 34"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      ) : (
                        <path
                          d="M 20 0 V 7 Q 20 17 30 17 H 34"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>

                    <Link
                      to={child.path}
                      className={`ml-7.5 w-full flex items-center px-3 py-1.5 rounded-xl text-xs transition-all ${
                        childActive
                          ? "bg-slate-100/90 text-slate-900 font-bold shadow-2xs"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/70 font-medium"
                      }`}
                    >
                      {child.label}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Collapsed mode with flyout card matching reference
    if (hasChildren && isCollapsed) {
      return (
        <div key={item.path} className="relative group flex justify-center">
          <button
            type="button"
            onClick={() => navigate(item.path)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isActive
                ? "bg-slate-100 text-slate-900 shadow-2xs font-bold"
                : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-4.5 h-4.5" />
          </button>

          {/* Flyout Card matching reference */}
          <div className="absolute left-full ml-3 top-0 bg-white border border-slate-200/80 rounded-[22px] shadow-[0_10px_35px_rgba(0,0,0,0.08)] p-2 min-w-[170px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="relative space-y-0">
              {item.children?.map((child, index) => {
                const childActive = isChildActive(child.path);
                const isLast = index === (item.children?.length ?? 0) - 1;

                return (
                  <div key={child.label} className="relative flex items-center h-8.5">
                    {/* Flyout Tree Branch Line matching reference */}
                    <svg
                      className="absolute left-0 top-0 w-6 h-full pointer-events-none text-slate-300"
                      viewBox="0 0 24 34"
                      fill="none"
                    >
                      {!isLast ? (
                        <path
                          d="M 10 0 V 34 M 10 7 Q 10 17 18 17 H 24"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      ) : (
                        <path
                          d="M 10 0 V 7 Q 10 17 18 17 H 24"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>

                    <Link
                      to={child.path}
                      className={`ml-5.5 w-full flex items-center px-3 py-1.5 rounded-xl text-xs transition-all ${
                        childActive
                          ? "bg-slate-100/90 text-slate-900 font-bold shadow-2xs"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/70 font-medium"
                      }`}
                    >
                      {child.label}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Standard navigation item (Dashboard, POS, Sales, Alerts, etc.)
    return isItemExpanded ? (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all ${
          isActive
            ? "bg-slate-100/90 text-slate-900 font-bold shadow-2xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
        <span>{item.label}</span>
      </Link>
    ) : (
      <div key={item.path} className="relative group flex justify-center">
        <Link
          to={item.path}
          title={item.label}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
            isActive
              ? "bg-slate-100 text-slate-900 shadow-2xs font-bold"
              : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Icon className="w-4.5 h-4.5" />
        </Link>
        <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-xl whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
          {item.label}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Desktop Floating Rounded Sidebar (lg: min 1024px) */}
      <aside
        className={`hidden lg:flex lg:flex-col fixed top-3 bottom-3 left-3 z-30 bg-white border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[28px] transition-all duration-300 ease-in-out select-none ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Floating Circular Collapse Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Lebarkan sidebar" : "Ciutkan sidebar"}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? "Lebarkan sidebar" : "Ciutkan sidebar"}
          className="absolute -right-3 top-5.5 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all cursor-pointer z-40 hover:scale-110 active:scale-95"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Top Header: Brand Logo */}
        <div
          className={`pt-5 pb-3 transition-all duration-300 ${
            isCollapsed ? "px-2 flex justify-center" : "px-4 flex items-center justify-between"
          }`}
        >
          <Link
            to="/dashboard"
            title="TakarLaba Dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0">
              <BrandLogo className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight">
                  TakarLaba
                </span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Margin Guard
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Scrollable Navigation Body */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-1 scrollbar-none"
          aria-label="Menu Utama"
        >
          {allowedNavItems.map((item) => renderItem(item))}
        </nav>

        {/* Demo Mode Information Widget (Sidebar) */}
        <div className="px-3 pb-1">
          <DemoBanner isCollapsed={isCollapsed} />
        </div>

        {/* Bottom Profile Card matching reference */}
        {!isCollapsed ? (
          <div className="p-3 border-t border-slate-100" ref={profileMenuRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/70 p-2 flex items-center justify-between transition-all cursor-pointer group select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                      {userName}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      {userRole === "OWNER" ? "PEMILIK" : "KASIR"}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isProfileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Popover / Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-2 z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                    <span>Keluar Akun</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-100 flex justify-center">
            <div className="relative group">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title={`${userName} (${userRole === "OWNER" ? "Pemilik" : "Kasir"}) - Klik untuk keluar`}
                className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-2xs cursor-pointer hover:ring-2 hover:ring-slate-300 transition-all"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  userName.slice(0, 2).toUpperCase()
                )}
              </button>
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-xl whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                <span className="font-bold">{userName}</span> &bull;{" "}
                {userRole === "OWNER" ? "Pemilik" : "Kasir"}
                <span className="block text-[10px] text-rose-300 mt-0.5">Klik untuk Keluar</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Top Header (hidden on desktop) */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 h-14 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Buka menu navigasi"
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer mr-0.5"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-900 text-white">
            <BrandLogo className="w-4.5 h-4.5" />
          </div>
          <span className="font-extrabold text-base text-slate-900 tracking-tight">TakarLaba</span>
          <span
            className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              userRole === "OWNER"
                ? "bg-slate-800 text-slate-200 border border-slate-700"
                : "bg-slate-200 text-slate-800"
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
          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </button>
      </header>

      {/* Mobile / Tablet Navigation Drawer */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Off-canvas panel */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                  <BrandLogo className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                    TakarLaba
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                    {userRole === "OWNER" ? "Pemilik" : "Kasir"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Tutup menu"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-none">
              {allowedNavItems.map((item) => renderItem(item, true))}
            </div>

            {/* Demo Banner (if OWNER) */}
            {userRole === "OWNER" && (
              <div className="p-3 border-t border-slate-100">
                <DemoBanner />
              </div>
            )}

            {/* User info & Logout */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
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
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Keluar Akun"
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 min-h-screen min-w-0 max-w-full flex flex-col bg-white overflow-x-clip transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-[6.25rem]" : "lg:pl-[17.75rem]"
        }`}
      >
        <div
          className={`flex-1 min-w-0 ${
            location.pathname === "/pos"
              ? "w-full flex flex-col p-0 pb-20 lg:pb-0"
              : "p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto"
          }`}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile & Tablet Bottom Navigation (fixed on screen widths < 1024px) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-start md:justify-around overflow-x-auto scrollbar-none shadow-lg"
        aria-label="Navigasi Bawah Mobile"
      >
        <div className="flex items-center justify-start md:justify-around w-full min-w-max md:min-w-0 gap-1 md:gap-1.5">
          {allowedNavItems.map((item) => {
            const isActive = isCurrentActive(item);
            const Icon = item.icon;
            const shortLabel = getNavShortLabel(item.label);

            return (
              <Link
                key={item.path}
                ref={isActive ? activeNavRef : undefined}
                to={item.path}
                className={`flex flex-col items-center justify-center shrink-0 min-w-[58px] md:min-w-0 md:flex-1 py-1 px-1 rounded-xl text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-slate-900 font-extrabold bg-slate-100/90 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`w-5 h-5 mb-0.5 ${isActive ? "text-slate-900" : "text-slate-400"}`}
                />
                <span className="truncate max-w-[62px] text-center">{shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default AppShell;
