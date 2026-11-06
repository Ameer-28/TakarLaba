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
  LogOut,
} from "lucide-react";

export interface BottomNavItem {
  id: string;
  label: string;
  shortLabel?: string;
  path: string;
  icon: React.ElementType;
}

// Mobile 5-slot navigation items
export const OWNER_MOBILE_NAV_ITEMS: BottomNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    shortLabel: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "ingredients",
    label: "Ingredients & Stock",
    shortLabel: "Ingredients",
    path: "/ingredients",
    icon: Package,
  },
  { id: "pos", label: "Point of Sale", shortLabel: "POS", path: "/pos", icon: Store },
  {
    id: "menus",
    label: "Menu & Costing",
    shortLabel: "Menu",
    path: "/menus",
    icon: UtensilsCrossed,
  },
  { id: "more", label: "All Features", shortLabel: "Features", path: "#more", icon: Grid2X2 },
];

export const CASHIER_MOBILE_NAV_ITEMS: BottomNavItem[] = [
  { id: "pos", label: "Point of Sale", shortLabel: "POS", path: "/pos", icon: Store },
  { id: "sales", label: "Sales History", shortLabel: "Sales", path: "/sales", icon: Receipt },
  { id: "pos_center", label: "Point of Sale", shortLabel: "POS", path: "/pos", icon: Store },
  { id: "sales_alt", label: "Sales History", shortLabel: "Sales", path: "/sales", icon: Receipt },
  { id: "logout", label: "Sign Out", shortLabel: "Sign Out", path: "#logout", icon: LogOut },
];

// Tablet direct navigation items displaying all available menus (no "All Features" / rightmost button needed)
export const OWNER_TABLET_NAV_ITEMS: BottomNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    shortLabel: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "pos",
    label: "Point of Sale (POS)",
    shortLabel: "POS",
    path: "/pos",
    icon: Store,
  },
  {
    id: "sales",
    label: "Sales History",
    shortLabel: "Sales",
    path: "/sales",
    icon: Receipt,
  },
  {
    id: "alerts",
    label: "Margin Alerts",
    shortLabel: "Alerts",
    path: "/alerts",
    icon: AlertTriangle,
  },
  {
    id: "ingredients",
    label: "Ingredients & Stock",
    shortLabel: "Ingredients",
    path: "/ingredients",
    icon: Package,
  },
  {
    id: "menus",
    label: "Menu & Costing",
    shortLabel: "Menu",
    path: "/menus",
    icon: UtensilsCrossed,
  },
  {
    id: "analytics",
    label: "Menu Analytics",
    shortLabel: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    id: "settings",
    label: "Settings",
    shortLabel: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export const CASHIER_TABLET_NAV_ITEMS: BottomNavItem[] = [
  {
    id: "pos",
    label: "Point of Sale (POS)",
    shortLabel: "POS",
    path: "/pos",
    icon: Store,
  },
  {
    id: "sales",
    label: "Sales History",
    shortLabel: "Sales",
    path: "/sales",
    icon: Receipt,
  },
  {
    id: "logout",
    label: "Sign Out",
    shortLabel: "Sign Out",
    path: "#logout",
    icon: LogOut,
  },
];

export function getMobileActiveIndex(pathname: string, userRole: UserRole): number {
  const isPosActive = pathname === "/pos";
  const isDashboardActive = pathname === "/dashboard" || pathname === "/";
  const isIngredientsActive = pathname.startsWith("/ingredients");
  const isMenusActive = pathname.startsWith("/menus");
  const isSalesActive = pathname.startsWith("/sales");
  const isAlertsActive = pathname.startsWith("/alerts");
  const isAnalyticsActive = pathname.startsWith("/analytics");
  const isSettingsActive = pathname.startsWith("/settings");
  const isMoreActive = isSalesActive || isAlertsActive || isAnalyticsActive || isSettingsActive;

  if (userRole === "OWNER") {
    if (isDashboardActive) return 0;
    if (isIngredientsActive) return 1;
    if (isPosActive) return 2;
    if (isMenusActive) return 3;
    if (isMoreActive) return 4;
    return 0;
  }

  if (isPosActive) return 0;
  if (isSalesActive) return 1;
  return 0;
}

export function getTabletActiveIndex(pathname: string, userRole: UserRole): number {
  const isPosActive = pathname === "/pos";
  const isDashboardActive = pathname === "/dashboard" || pathname === "/";
  const isIngredientsActive = pathname.startsWith("/ingredients");
  const isMenusActive = pathname.startsWith("/menus");
  const isSalesActive = pathname.startsWith("/sales");
  const isAlertsActive = pathname.startsWith("/alerts");
  const isAnalyticsActive = pathname.startsWith("/analytics");
  const isSettingsActive = pathname.startsWith("/settings");

  if (userRole === "OWNER") {
    if (isDashboardActive) return 0;
    if (isPosActive) return 1;
    if (isSalesActive) return 2;
    if (isAlertsActive) return 3;
    if (isIngredientsActive) return 4;
    if (isMenusActive) return 5;
    if (isAnalyticsActive) return 6;
    if (isSettingsActive) return 7;
    return 0;
  }

  if (isPosActive) return 0;
  if (isSalesActive) return 1;
  return 0;
}
