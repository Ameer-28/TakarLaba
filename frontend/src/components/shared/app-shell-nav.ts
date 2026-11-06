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
    label: "Point of Sale (POS)",
    path: "/pos",
    icon: Store,
    roles: ["OWNER", "CASHIER"],
    section: "MAIN",
  },
  {
    label: "Sales History",
    path: "/sales",
    icon: Receipt,
    roles: ["OWNER", "CASHIER"],
    section: "MAIN",
  },
  {
    label: "Margin Alerts",
    path: "/alerts",
    icon: AlertTriangle,
    roles: ["OWNER"],
    section: "MAIN",
  },
  {
    label: "Ingredients & Stock",
    path: "/ingredients",
    icon: Package,
    roles: ["OWNER"],
    section: "OPERASIONAL",
    children: [
      { label: "Ingredient Catalog", path: "/ingredients?tab=catalog" },
      { label: "Stock & FEFO", path: "/ingredients?tab=stock" },
      { label: "Purchase Invoices", path: "/ingredients?tab=history" },
      { label: "Waste Log", path: "/ingredients?tab=waste" },
      { label: "Stock Adjustments", path: "/ingredients?tab=adjustments" },
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
    label: "Menu Analytics",
    path: "/analytics",
    icon: BarChart3,
    roles: ["OWNER"],
    section: "OPERASIONAL",
  },
  {
    label: "Settings",
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
  if (label.startsWith("Point of Sale") || label.startsWith("Kasir") || label.includes("POS"))
    return "POS";
  if (label.startsWith("Sales") || label.startsWith("Riwayat")) return "Sales";
  if (label.startsWith("Margin Alerts") || label.startsWith("Peringatan")) return "Alerts";
  if (label.startsWith("Ingredients") || label.startsWith("Bahan")) return "Ingredients";
  if (label.startsWith("Menu Analytics") || label.startsWith("Analitik")) return "Analytics";
  if (label.startsWith("Menu &") || label.startsWith("Menu")) return "Menu";
  if (label.startsWith("Settings") || label.startsWith("Pengaturan")) return "Settings";
  return label.split(" ")[0] ?? label;
}
