import { describe, it, expect } from "vitest";
import {
  OWNER_MOBILE_NAV_ITEMS,
  CASHIER_MOBILE_NAV_ITEMS,
  OWNER_TABLET_NAV_ITEMS,
  CASHIER_TABLET_NAV_ITEMS,
  getMobileActiveIndex,
  getTabletActiveIndex,
} from "./curved-bottom-nav-config";

describe("CurvedBottomNav - Responsive Navigation (Mobile vs Tablet)", () => {
  describe("Tablet Navigation Configuration", () => {
    it("displays all 8 menus directly for OWNER without 'All Features' rightmost trigger", () => {
      expect(OWNER_TABLET_NAV_ITEMS).toHaveLength(8);

      const itemIds = OWNER_TABLET_NAV_ITEMS.map((item) => item.id);
      expect(itemIds).toEqual([
        "dashboard",
        "pos",
        "sales",
        "alerts",
        "ingredients",
        "menus",
        "analytics",
        "settings",
      ]);

      // Verify "more" / "All Features" button is NOT present on tablet
      expect(itemIds).not.toContain("more");

      const paths = OWNER_TABLET_NAV_ITEMS.map((item) => item.path);
      expect(paths).toEqual([
        "/dashboard",
        "/pos",
        "/sales",
        "/alerts",
        "/ingredients",
        "/menus",
        "/analytics",
        "/settings",
      ]);
    });

    it("has concise short labels for every tablet navigation item", () => {
      const shortLabels = OWNER_TABLET_NAV_ITEMS.map((item) => item.shortLabel);
      expect(shortLabels).toEqual([
        "Dashboard",
        "POS",
        "Sales",
        "Alerts",
        "Ingredients",
        "Menu",
        "Analytics",
        "Settings",
      ]);
    });

    it("displays direct actions for CASHIER on tablet", () => {
      const cashierIds = CASHIER_TABLET_NAV_ITEMS.map((item) => item.id);
      expect(cashierIds).toEqual(["pos", "sales", "logout"]);
      expect(cashierIds).not.toContain("more");
    });
  });

  describe("Mobile Navigation Configuration", () => {
    it("displays 5 slots for OWNER on mobile with the 5th item being 'All Features'", () => {
      expect(OWNER_MOBILE_NAV_ITEMS).toHaveLength(5);
      expect(OWNER_MOBILE_NAV_ITEMS[4]?.id).toBe("more");
      expect(OWNER_MOBILE_NAV_ITEMS[4]?.label).toBe("All Features");
    });

    it("displays 5 slots for CASHIER on mobile", () => {
      expect(CASHIER_MOBILE_NAV_ITEMS).toHaveLength(5);
    });
  });

  describe("Active Index Calculation", () => {
    describe("getTabletActiveIndex", () => {
      it("maps each route to its exact dedicated index for OWNER on tablet", () => {
        expect(getTabletActiveIndex("/dashboard", "OWNER")).toBe(0);
        expect(getTabletActiveIndex("/", "OWNER")).toBe(0);
        expect(getTabletActiveIndex("/pos", "OWNER")).toBe(1);
        expect(getTabletActiveIndex("/sales", "OWNER")).toBe(2);
        expect(getTabletActiveIndex("/sales?from=2026-10-01", "OWNER")).toBe(2);
        expect(getTabletActiveIndex("/alerts", "OWNER")).toBe(3);
        expect(getTabletActiveIndex("/ingredients", "OWNER")).toBe(4);
        expect(getTabletActiveIndex("/ingredients?tab=stock", "OWNER")).toBe(4);
        expect(getTabletActiveIndex("/menus", "OWNER")).toBe(5);
        expect(getTabletActiveIndex("/analytics", "OWNER")).toBe(6);
        expect(getTabletActiveIndex("/settings", "OWNER")).toBe(7);
      });

      it("maps routes correctly for CASHIER on tablet", () => {
        expect(getTabletActiveIndex("/pos", "CASHIER")).toBe(0);
        expect(getTabletActiveIndex("/sales", "CASHIER")).toBe(1);
      });
    });

    describe("getMobileActiveIndex", () => {
      it("maps primary routes to 0-3 and secondary routes to 4 ('more') for OWNER on mobile", () => {
        expect(getMobileActiveIndex("/dashboard", "OWNER")).toBe(0);
        expect(getMobileActiveIndex("/ingredients", "OWNER")).toBe(1);
        expect(getMobileActiveIndex("/pos", "OWNER")).toBe(2);
        expect(getMobileActiveIndex("/menus", "OWNER")).toBe(3);

        // Secondary routes map to slot 4 ("All Features")
        expect(getMobileActiveIndex("/sales", "OWNER")).toBe(4);
        expect(getMobileActiveIndex("/alerts", "OWNER")).toBe(4);
        expect(getMobileActiveIndex("/analytics", "OWNER")).toBe(4);
        expect(getMobileActiveIndex("/settings", "OWNER")).toBe(4);
      });

      it("maps routes correctly for CASHIER on mobile", () => {
        expect(getMobileActiveIndex("/pos", "CASHIER")).toBe(0);
        expect(getMobileActiveIndex("/sales", "CASHIER")).toBe(1);
      });
    });
  });
});
