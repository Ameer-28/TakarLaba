import { describe, it, expect } from "vitest";
import {
  calculateQuickCashOptions,
  formatPaymentMethodLabel,
  calculateCashChange,
  isBeverageMenu,
  getDefaultTemperature,
  formatPosMenuName,
  getMenuImageUrl,
} from "./pos-utils";

describe("calculateQuickCashOptions", () => {
  it("includes exact total amount (uang pas) as first option", () => {
    const options = calculateQuickCashOptions(15000);
    expect(options[0]).toBe(15000);
  });

  it("suggests round denominations higher than total", () => {
    const options = calculateQuickCashOptions(17500);
    expect(options).toContain(17500);
    expect(options).toContain(20000);
    expect(options).toContain(50000);
  });

  it("limits result to at most 4 options", () => {
    const options = calculateQuickCashOptions(7500);
    expect(options.length).toBeLessThanOrEqual(4);
  });
});

describe("calculateCashChange", () => {
  it("calculates exact change when payment exceeds total amount", () => {
    const result = calculateCashChange(18000, 20000);
    expect(result.isInsufficient).toBe(false);
    expect(result.change).toBe(2000);
    expect(result.shortage).toBe(0);
  });

  it("calculates zero change when payment is exact (uang pas)", () => {
    const result = calculateCashChange(18000, 18000);
    expect(result.isInsufficient).toBe(false);
    expect(result.change).toBe(0);
    expect(result.shortage).toBe(0);
  });

  it("identifies underpayment and calculates shortage", () => {
    const result = calculateCashChange(25000, 20000);
    expect(result.isInsufficient).toBe(true);
    expect(result.change).toBe(0);
    expect(result.shortage).toBe(5000);
  });
});

describe("formatPaymentMethodLabel", () => {
  it("translates payment method codes to localized Indonesian text", () => {
    expect(formatPaymentMethodLabel("CASH")).toBe("Tunai");
    expect(formatPaymentMethodLabel("QRIS")).toBe("QRIS");
    expect(formatPaymentMethodLabel("TRANSFER")).toBe("Transfer Bank");
  });
});

describe("isBeverageMenu & getDefaultTemperature", () => {
  it("identifies coffee and beverage items accurately", () => {
    expect(isBeverageMenu("Americano", null)).toBe(true);
    expect(isBeverageMenu("Es Kopi Susu Aren", "Minuman")).toBe(true);
    expect(isBeverageMenu("Matcha Latte", "Beverage")).toBe(true);
    expect(isBeverageMenu("Teh Tarik", null)).toBe(true);
    expect(isBeverageMenu("Lemon Juice", "Drink")).toBe(true);
  });

  it("returns false for non-beverage items like snacks and food", () => {
    expect(isBeverageMenu("Roti Bakar Cokelat", "Snack")).toBe(false);
    expect(isBeverageMenu("Nasi Goreng", "Makanan")).toBe(false);
    expect(isBeverageMenu("Croissant", "Pastry")).toBe(false);
  });

  it("determines default temperature based on menu name hints", () => {
    expect(getDefaultTemperature("Kopi Tubruk Panas")).toBe("HOT");
    expect(getDefaultTemperature("Hot Cappuccino")).toBe("HOT");
    expect(getDefaultTemperature("Teh Hangat")).toBe("HOT");
    expect(getDefaultTemperature("Manual Brew V60")).toBe("HOT");
    expect(getDefaultTemperature("Es Kopi Susu")).toBe("ICE");
    expect(getDefaultTemperature("Americano")).toBe("ICE");
  });
});

describe("formatPosMenuName", () => {
  it("strips leading 'Es ' from menu names for POS display", () => {
    expect(formatPosMenuName("Es Kopi Susu Aren")).toBe("Kopi Susu Aren");
    expect(formatPosMenuName("Es Teh Manis")).toBe("Teh Manis");
    expect(formatPosMenuName("es matcha latte")).toBe("matcha latte");
  });

  it("preserves names that do not start with 'Es '", () => {
    expect(formatPosMenuName("Americano")).toBe("Americano");
    expect(formatPosMenuName("Croissant")).toBe("Croissant");
  });
});

describe("getMenuImageUrl", () => {
  it("resolves specific image paths for core demo menu items", () => {
    expect(getMenuImageUrl("Es Kopi Susu Aren", "Kopi")).toBe("/images/menus/kopi-susu.jpg");
    expect(getMenuImageUrl("Americano", "Kopi")).toBe("/images/menus/americano.jpg");
    expect(getMenuImageUrl("Matcha Latte", "Non-Kopi")).toBe("/images/menus/matcha.jpg");
    expect(getMenuImageUrl("Es Teh Manis", "Non-Kopi")).toBe("/images/menus/es-teh.jpg");
    expect(getMenuImageUrl("Roti Bakar", "Makanan")).toBe("/images/menus/roti-bakar.jpg");
    expect(getMenuImageUrl("Croissant", "Makanan")).toBe("/images/menus/croissant.jpg");
  });

  it("falls back to category-level default culinary images for other items", () => {
    expect(getMenuImageUrl("V60 Gayo", "Kopi")).toBe("/images/menus/default-coffee.jpg");
    expect(getMenuImageUrl("Jus Alpukat", "Minuman")).toBe("/images/menus/default-drink.jpg");
    expect(getMenuImageUrl("Brownies", "Dessert")).toBe("/images/menus/default-pastry.jpg");
    expect(getMenuImageUrl("Nasi Goreng Spesial", "Makanan")).toBe(
      "/images/menus/default-food.jpg"
    );
  });
});
