import { describe, it, expect, vi } from "vitest";
import {
  NAV_ITEMS,
  SIDEBAR_STORAGE_KEY,
  getInitialSidebarCollapsed,
  saveSidebarCollapsed,
  filterNavItemsByRole,
  getNavShortLabel,
} from "./app-shell-nav";

describe("AppShell Sidebar State & Navigation (BR-NAV)", () => {
  describe("Sidebar Collapse State Persistence", () => {
    it("defaults to false when storage is undefined or empty", () => {
      expect(getInitialSidebarCollapsed(undefined)).toBe(false);

      const mockStorage: Storage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      };

      expect(getInitialSidebarCollapsed(mockStorage)).toBe(false);
      expect(mockStorage.getItem).toHaveBeenCalledWith(SIDEBAR_STORAGE_KEY);
    });

    it("returns true when storage contains 'true'", () => {
      const mockStorage: Storage = {
        getItem: vi.fn(() => "true"),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 1,
      };

      expect(getInitialSidebarCollapsed(mockStorage)).toBe(true);
    });

    it("returns false when storage contains 'false' or invalid string", () => {
      const mockStorage: Storage = {
        getItem: vi.fn(() => "false"),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 1,
      };

      expect(getInitialSidebarCollapsed(mockStorage)).toBe(false);
    });

    it("saves collapsed state string to storage", () => {
      const mockStorage: Storage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      };

      saveSidebarCollapsed(true, mockStorage);
      expect(mockStorage.setItem).toHaveBeenCalledWith(SIDEBAR_STORAGE_KEY, "true");

      saveSidebarCollapsed(false, mockStorage);
      expect(mockStorage.setItem).toHaveBeenCalledWith(SIDEBAR_STORAGE_KEY, "false");
    });

    it("handles throwing storage gracefully without uncaught exceptions", () => {
      const brokenStorage: Storage = {
        getItem: vi.fn(() => {
          throw new Error("QuotaExceededError or Privacy Block");
        }),
        setItem: vi.fn(() => {
          throw new Error("QuotaExceededError or Privacy Block");
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      };

      expect(getInitialSidebarCollapsed(brokenStorage)).toBe(false);
      expect(() => saveSidebarCollapsed(true, brokenStorage)).not.toThrow();
    });
  });

  describe("Role-Based Navigation Items Filtering", () => {
    it("returns only CASHIER accessible items for CASHIER role", () => {
      const cashierItems = filterNavItemsByRole(NAV_ITEMS, "CASHIER");
      const paths = cashierItems.map((i) => i.path);

      expect(paths).toContain("/pos");
      expect(paths).toContain("/sales");
      expect(paths).not.toContain("/dashboard");
      expect(paths).not.toContain("/ingredients");
      expect(paths).not.toContain("/menus");
      expect(paths).not.toContain("/alerts");
      expect(paths).not.toContain("/analytics");
      expect(paths).not.toContain("/settings");
    });

    it("returns all management items for OWNER role", () => {
      const ownerItems = filterNavItemsByRole(NAV_ITEMS, "OWNER");
      const paths = ownerItems.map((i) => i.path);

      expect(paths).toContain("/dashboard");
      expect(paths).toContain("/pos");
      expect(paths).toContain("/sales");
      expect(paths).toContain("/ingredients");
      expect(paths).toContain("/menus");
      expect(paths).toContain("/alerts");
      expect(paths).toContain("/analytics");
      expect(paths).toContain("/settings");
    });

    it("ensures each navigation item has unique path and label", () => {
      const paths = NAV_ITEMS.map((i) => i.path);
      const labels = NAV_ITEMS.map((i) => i.label);

      expect(new Set(paths).size).toBe(NAV_ITEMS.length);
      expect(new Set(labels).size).toBe(NAV_ITEMS.length);
    });

    it("generates concise short labels for mobile and tablet bottom navigation for all items", () => {
      const ownerItems = filterNavItemsByRole(NAV_ITEMS, "OWNER");
      expect(ownerItems).toHaveLength(8);

      const shortLabels = ownerItems.map((item) => getNavShortLabel(item.label));
      expect(shortLabels).toEqual([
        "Dashboard",
        "Kasir",
        "Riwayat",
        "Peringatan",
        "Bahan",
        "Menu",
        "Analitik",
        "Pengaturan",
      ]);
    });
  });
});
