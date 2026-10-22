import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { signOut, useSession, type UserRole } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Store,
  Package,
  UtensilsCrossed,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  Receipt,
  Loader2,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["OWNER"],
  },
  {
    label: "Kasir (POS)",
    path: "/pos",
    icon: Store,
    roles: ["OWNER", "CASHIER"],
  },
  {
    label: "Riwayat Penjualan",
    path: "/sales",
    icon: Receipt,
    roles: ["OWNER", "CASHIER"],
  },
  {
    label: "Bahan Baku & Stok",
    path: "/ingredients",
    icon: Package,
    roles: ["OWNER"],
  },
  {
    label: "Menu & Costing",
    path: "/menus",
    icon: UtensilsCrossed,
    roles: ["OWNER"],
  },
  {
    label: "Peringatan Margin",
    path: "/alerts",
    icon: AlertTriangle,
    roles: ["OWNER"],
  },
  {
    label: "Analitik Menu",
    path: "/analytics",
    icon: BarChart3,
    roles: ["OWNER"],
  },
  {
    label: "Pengaturan",
    path: "/settings",
    icon: Settings,
    roles: ["OWNER"],
  },
];

export function AppShell() {
  const { data: session } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userRole = (session?.user?.role as UserRole | undefined) ?? "CASHIER";
  const userName = session?.user?.name || "Pengguna";
  const userEmail = session?.user?.email || "";

  const allowedNavItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar (lg: min 1024px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-slate-200 lg:bg-white lg:z-30">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600 text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
              TakarLaba
            </span>
            <span className="text-[11px] font-medium text-emerald-700 tracking-wide uppercase">
              Margin Guard &bull; UMKM
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" aria-label="Menu Utama">
          {allowedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 pr-2">
              <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                userRole === "OWNER"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {userRole === "OWNER" ? "Pemilik" : "Kasir"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors disabled:opacity-60"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
            ) : (
              <LogOut className="w-4 h-4 text-slate-500 hover:text-rose-600" />
            )}
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (hidden on desktop) */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-600 text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">TakarLaba</span>
          <span
            className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
              userRole === "OWNER" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
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
          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 min-h-screen flex flex-col">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (fixed on mobile 360px up to 1023px) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex justify-around items-center shadow-lg"
        aria-label="Navigasi Bawah Mobile"
      >
        {allowedNavItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? "text-emerald-700 font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 ${isActive ? "text-emerald-700" : "text-slate-500"}`}
              />
              <span className="truncate max-w-[64px]">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
