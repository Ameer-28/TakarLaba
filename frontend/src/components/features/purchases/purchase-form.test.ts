import { describe, it, expect } from "vitest";
import {
  purchaseFormSchema,
  purchaseItemSchema,
  type PurchaseFormValues,
} from "./purchase-form-types";

describe("Purchase Form Schema & Calculation Logic (T-112 — FR-PUR-01)", () => {
  describe("purchaseItemSchema Validation", () => {
    it("accepts a valid purchase line item", () => {
      const validItem = {
        ingredientId: "ing-123",
        purchaseUnit: "KG",
        purchaseQty: 5,
        purchaseUnitPrice: 25000,
        expiryDate: "2026-12-31",
      };

      const result = purchaseItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.purchaseQty).toBe(5);
        expect(result.data.purchaseUnitPrice).toBe(25000);
      }
    });

    it("accepts decimal purchase quantity (e.g. 2.5 kg)", () => {
      const validDecimalItem = {
        ingredientId: "ing-123",
        purchaseUnit: "KG",
        purchaseQty: 2.5,
        purchaseUnitPrice: 30000,
      };

      const result = purchaseItemSchema.safeParse(validDecimalItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.purchaseQty).toBe(2.5);
      }
    });

    it("rejects empty ingredientId with localized error message", () => {
      const invalid = {
        ingredientId: "",
        purchaseUnit: "KG",
        purchaseQty: 1,
        purchaseUnitPrice: 10000,
      };

      const result = purchaseItemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldError = result.error.issues.find((i) => i.path.includes("ingredientId"));
        expect(fieldError?.message).toBe("Select an ingredient");
      }
    });

    it("rejects zero or negative purchase quantity", () => {
      const zeroQty = {
        ingredientId: "ing-1",
        purchaseUnit: "KG",
        purchaseQty: 0,
        purchaseUnitPrice: 10000,
      };
      const negQty = {
        ingredientId: "ing-1",
        purchaseUnit: "KG",
        purchaseQty: -3,
        purchaseUnitPrice: 10000,
      };

      expect(purchaseItemSchema.safeParse(zeroQty).success).toBe(false);
      expect(purchaseItemSchema.safeParse(negQty).success).toBe(false);
    });

    it("rejects zero or negative purchase unit price", () => {
      const zeroPrice = {
        ingredientId: "ing-1",
        purchaseUnit: "KG",
        purchaseQty: 1,
        purchaseUnitPrice: 0,
      };
      const negPrice = {
        ingredientId: "ing-1",
        purchaseUnit: "KG",
        purchaseQty: 1,
        purchaseUnitPrice: -5000,
      };

      expect(purchaseItemSchema.safeParse(zeroPrice).success).toBe(false);
      expect(purchaseItemSchema.safeParse(negPrice).success).toBe(false);
    });
  });

  describe("purchaseFormSchema Validation", () => {
    it("accepts a complete valid purchase invoice with multiple items", () => {
      const validForm: PurchaseFormValues = {
        invoiceNumber: "INV-2026-11-001",
        supplierName: "Toko Bahan Kue Berkah",
        purchasedAt: "2026-11-04",
        items: [
          {
            ingredientId: "ing-1",
            purchaseUnit: "KG",
            purchaseQty: 10,
            purchaseUnitPrice: 15000,
            expiryDate: "2026-12-01",
          },
          {
            ingredientId: "ing-2",
            purchaseUnit: "L",
            purchaseQty: 5,
            purchaseUnitPrice: 20000,
          },
        ],
      };

      const result = purchaseFormSchema.safeParse(validForm);
      expect(result.success).toBe(true);
    });

    it("rejects form when items array is empty", () => {
      const emptyItems = {
        invoiceNumber: "INV-001",
        supplierName: "Supplier A",
        purchasedAt: "2026-11-04",
        items: [],
      };

      const result = purchaseFormSchema.safeParse(emptyItems);
      expect(result.success).toBe(false);
      if (!result.success) {
        const itemIssue = result.error.issues.find((i) => i.path.includes("items"));
        expect(itemIssue?.message).toBe("At least 1 item must be purchased");
      }
    });

    it("rejects form when purchasedAt is missing or empty", () => {
      const noDate = {
        purchasedAt: "",
        items: [
          {
            ingredientId: "ing-1",
            purchaseUnit: "KG",
            purchaseQty: 1,
            purchaseUnitPrice: 10000,
          },
        ],
      };

      const result = purchaseFormSchema.safeParse(noDate);
      expect(result.success).toBe(false);
      if (!result.success) {
        const dateIssue = result.error.issues.find((i) => i.path.includes("purchasedAt"));
        expect(dateIssue?.message).toBe("Purchase date is required");
      }
    });
  });

  describe("Purchase Calculation & Total Amount Logic", () => {
    const calculateTotalAmount = (
      items:
        Array<{ purchaseQty?: number | null; purchaseUnitPrice?: number | null }> | null | undefined
    ): number => {
      if (!items || items.length === 0) return 0;
      return items.reduce((acc, item) => {
        const qty = Number(item?.purchaseQty) || 0;
        const price = Number(item?.purchaseUnitPrice) || 0;
        return acc + qty * price;
      }, 0);
    };

    it("computes total amount accurately for integer values", () => {
      const items = [
        { purchaseQty: 5, purchaseUnitPrice: 20000 }, // 100,000
        { purchaseQty: 3, purchaseUnitPrice: 15000 }, // 45,000
      ];
      expect(calculateTotalAmount(items)).toBe(145000);
    });

    it("computes total amount accurately for decimal quantities", () => {
      const items = [
        { purchaseQty: 2.5, purchaseUnitPrice: 14000 }, // 35,000
        { purchaseQty: 0.75, purchaseUnitPrice: 40000 }, // 30,000
      ];
      expect(calculateTotalAmount(items)).toBe(65000);
    });

    it("returns 0 for empty or nullish item lists", () => {
      expect(calculateTotalAmount([])).toBe(0);
      expect(calculateTotalAmount(null)).toBe(0);
      expect(calculateTotalAmount(undefined)).toBe(0);
    });

    it("safely handles partially filled or invalid numeric entries", () => {
      const items = [
        { purchaseQty: null, purchaseUnitPrice: 20000 },
        { purchaseQty: 2, purchaseUnitPrice: undefined },
        { purchaseQty: 3, purchaseUnitPrice: 10000 }, // 30,000
      ];
      expect(calculateTotalAmount(items)).toBe(30000);
    });
  });
});
