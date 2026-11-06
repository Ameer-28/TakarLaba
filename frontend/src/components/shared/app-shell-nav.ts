import type { UserRole } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Store,
  Package,
  UtensilsCrossed,
  AlertTriangle,
  BarChart3,
  Settings,
  Receipt,
} from "lucide-react";

export interface NavChildItem {
  label: string;
  path: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  section?: "MAIN" | "OPERASIONAL";
  children?: NavChildItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["OWNER"],
    section: "MAIN",
  },
  {
    label: "Kasir (POS)",
    path: "/pos",
    icon: Store,
    roles: ["OWNER", "CASHIER"],
    section: "MAIN",
  },
  {
    label: "Riwayat Penjualan",
    path: "/sales",
    icon: Receipt,
    roles: ["OWNER", "CASHIER"],
    section: "MAIN",
  },
  {
    label: "Peringatan Margin",
    path: "/alerts",
    icon: AlertTriangle,
    roles: ["OWNER"],
    section: "MAIN",
  },
  {
    label: "Bahan Baku & Stok",
    path: "/ingredients",
    icon: Package,
    roles: ["OWNER"],
    section: "OPERASIONAL",
    children: [
      { label: "Katalog Bahan", path: "/ingredients?tab=catalog" },
      { label: "Stok & FEFO", path: "/ingredients?tab=stock" },
      { label: "Riwayat Belanja", path: "/ingredients?tab=history" },
      { label: "Bahan Terbuang", path: "/ingredients?tab=waste" },
      { label: "Riwayat Opname", path: "/ingredients?tab=adjustments" },
      { label: "Waste Radar", path: "/ingredients?tab=radar" },
    ],
  },
  {
    label: "Menu & Costing",
    path: "/menus",
    icon: UtensilsCrossed,
    roles: ["OWNER"],
    section: "OPERASIONAL",
  },
  {
    label: "Analitik Menu",
    path: "/analytics",
    icon: BarChart3,
    roles: ["OWNER"],
    section: "OPERASIONAL",
  },
  {
    label: "Pengaturan",
    path: "/settings",
    icon: Settings,
    roles: ["OWNER"],
    section: "OPERASIONAL",
  },
];

export const SIDEBAR_STORAGE_KEY = "takarlaba_sidebar_collapsed";

export function getInitialSidebarCollapsed(storage?: Storage): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveSidebarCollapsed(collapsed: boolean, storage?: Storage): void {
  if (!storage) return;
  try {
    storage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  } catch {
    // Safe to ignore in sandbox or strict privacy environments
  }
}

export function filterNavItemsByRole(items: NavItem[], role: UserRole): NavItem[] {
  return items.filter((item) => item.roles.includes(role));
}

export function getNavShortLabel(label: string): string {
  if (label.startsWith("Dashboard")) return "Dashboard";
  if (label.startsWith("Kasir")) return "Kasir";
  if (label.startsWith("Riwayat")) return "Riwayat";
  if (label.startsWith("Peringatan")) return "Peringatan";
  if (label.startsWith("Bahan")) return "Bahan";
  if (label.startsWith("Menu")) return "Menu";
  if (label.startsWith("Analitik")) return "Analitik";
  if (label.startsWith("Pengaturan")) return "Pengaturan";
  return label.split(" ")[0] ?? label;
}
