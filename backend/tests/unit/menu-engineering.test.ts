import { describe, it, expect } from "vitest";
import {
  calculateMenuEngineering,
  type MenuItemEngineeringInput,
} from "../../src/domain/menu-engineering.js";

describe("Domain: calculateMenuEngineering (BR-10, FR-MEG-01, PRD Lampiran B)", () => {
  const pastDate = new Date("2026-09-01T00:00:00Z"); // > 14 days ago
  const asOfDate = new Date("2026-10-31T00:00:00Z");

  // Fixture B - 6 menus before price shock (1.300 portions, 30 days)
  const fixtureBMenusBeforeShock: MenuItemEngineeringInput[] = [
    {
      menuId: "menu-kopi-susu",
      menuName: "Es Kopi Susu Aren",
      category: "Minuman",
      sellingPrice: "18000",
      hppPenuh: "8940",
      portionsSold: 400,
      createdAt: pastDate,
      hasRecipe: true,
      isCostComplete: true,
    },
    {
      menuId: "menu-americano",
      menuName: "Americano",
      category: "Minuman",
      sellingPrice: "15000",
      hppPenuh: "4800",
      portionsSold: 400,
      createdAt: pastDate,
      hasRecipe: true,
      isCostComplete: true,
    },
    {
      menuId: "menu-teh-manis",
      menuName: "Es Teh Manis",
      category: "Minuman",
      sellingPrice: "8000",
      hppPenuh: "3200",
      portionsSold: 200,
      createdAt: pastDate,
      hasRecipe: true,
      isCostComplete: true,
    },
    {
      menuId: "menu-roti-bakar",
      menuName: "Roti Bakar",
      category: "Makanan",
      sellingPrice: "16000",
      hppPenuh: "8500",
      portionsSold: 170,
      createdAt: pastDate,
      hasRecipe: true,
      isCostComplete: true,
    },
    {
      menuId: "menu-matcha",
      menuName: "Matcha Latte",
      category: "Minuman",
      sellingPrice: "22000",
      hppPenuh: "10500",
      portionsSold: 80,
      createdAt: pastDate,
      hasRecipe: true,
      isCostComplete: true,
    },
    {
      menuId: "menu-croissant",
      menuName: "Croissant",
      category: "Makanan",
      sellingPrice: "20000",
      hppPenuh: "12500",
      portionsSold: 50,
      createdAt: pastDate,
      hasRecipe: true,
      isCostComplete: true,
      exclusiveIngredientNames: ["Croissant Beku"],
      exclusiveIngredientStockValue: "105000",
    },
  ];

  it("classifies Fixture B 6/6 menus correctly before price shock", () => {
    const result = calculateMenuEngineering(fixtureBMenusBeforeShock, {
      days: 30,
      totalTransactions: 650,
      priceRoundingStep: 100,
      asOfDate,
    });

    expect(result.isDataSufficient).toBe(true);
    expect(result.totalClassifiedPortions).toBe(1300);

    // Ambang populer = 0.7 * (1/6) * 1300 = 151.666...
    expect(result.popularityThresholdPortions.toFixed(2)).toBe("151.67");

    // Ambang margin tertimbang = 11.234.000 / 1300 = 8641.538...
    expect(result.weightedMarginThreshold.toFixed(1)).toBe("8641.5");

    const map = new Map(result.classifiedMenus.map((m) => [m.menuId, m]));

    // 1. Es Kopi Susu Aren: CM 9060 >= 8641.5 & sold 400 >= 151.67 -> STAR
    const kopiSusu = map.get("menu-kopi-susu")!;
    expect(kopiSusu.marginKontribusi.toNumber()).toBe(9060);
    expect(kopiSusu.quadrant).toBe("STAR");
    expect(kopiSusu.recommendation.type).toBe("STAR");

    // 2. Americano: CM 10200 >= 8641.5 & sold 400 >= 151.67 -> STAR
    const americano = map.get("menu-americano")!;
    expect(americano.marginKontribusi.toNumber()).toBe(10200);
    expect(americano.quadrant).toBe("STAR");

    // 3. Es Teh Manis: CM 4800 < 8641.5 & sold 200 >= 151.67 -> PLOWHORSE
    const tehManis = map.get("menu-teh-manis")!;
    expect(tehManis.marginKontribusi.toNumber()).toBe(4800);
    expect(tehManis.quadrant).toBe("PLOWHORSE");
    // Breakeven drop on +1000 = 1 - 4800 / 5800 = 17.2%
    expect(tehManis.recommendation.actionMetric?.value).toBe("17.2%");

    // 4. Roti Bakar: CM 7500 < 8641.5 & sold 170 >= 151.67 -> PLOWHORSE
    const rotiBakar = map.get("menu-roti-bakar")!;
    expect(rotiBakar.marginKontribusi.toNumber()).toBe(7500);
    expect(rotiBakar.quadrant).toBe("PLOWHORSE");

    // 5. Matcha Latte: CM 11500 >= 8641.5 & sold 80 < 151.67 -> PUZZLE
    const matcha = map.get("menu-matcha")!;
    expect(matcha.marginKontribusi.toNumber()).toBe(11500);
    expect(matcha.quadrant).toBe("PUZZLE");
    // Diskon aman = 11500 - 8641.5 ~ Rp2.800 (step 100)
    expect(matcha.recommendation.actionMetric?.value).toBe("Rp2.800");

    // 6. Croissant: CM 7500 < 8641.5 & sold 50 < 151.67 -> DOG
    const croissant = map.get("menu-croissant")!;
    expect(croissant.marginKontribusi.toNumber()).toBe(7500);
    expect(croissant.quadrant).toBe("DOG");
    expect(croissant.recommendation.description).toContain("Croissant Beku");
    expect(croissant.recommendation.actionMetric?.value).toBe("Rp105.000");
  });

  it("shifts Es Kopi Susu Aren to PLOWHORSE after price shock (Susu UHT Rp24/ml)", () => {
    // Susu UHT rises from 18 to 24 -> +6 * 150ml = +900
    // HPP Penuh Es Kopi Susu = 8940 + 900 = 9840 -> CM = 18000 - 9840 = 8160
    const fixtureBMenusAfterShock: MenuItemEngineeringInput[] = fixtureBMenusBeforeShock.map((m) =>
      m.menuId === "menu-kopi-susu" ? { ...m, hppPenuh: "9840" } : m
    );

    const result = calculateMenuEngineering(fixtureBMenusAfterShock, {
      days: 30,
      totalTransactions: 650,
      priceRoundingStep: 100,
      asOfDate,
    });

    // Total CM = 10.874.000 / 1300 = 8364.6
    expect(result.weightedMarginThreshold.toFixed(1)).toBe("8364.6");

    const map = new Map(result.classifiedMenus.map((m) => [m.menuId, m]));

    // Es Kopi Susu Aren: CM 8160 < 8364.6 & sold 400 >= 151.67 -> PLOWHORSE
    const kopiSusu = map.get("menu-kopi-susu")!;
    expect(kopiSusu.marginKontribusi.toNumber()).toBe(8160);
    expect(kopiSusu.quadrant).toBe("PLOWHORSE");

    // All other menus maintain identical quadrants
    expect(map.get("menu-americano")!.quadrant).toBe("STAR");
    expect(map.get("menu-teh-manis")!.quadrant).toBe("PLOWHORSE");
    expect(map.get("menu-roti-bakar")!.quadrant).toBe("PLOWHORSE");
    expect(map.get("menu-matcha")!.quadrant).toBe("PUZZLE");
    expect(map.get("menu-croissant")!.quadrant).toBe("DOG");
  });

  it("enforces data sufficiency guards (< 4 menus or < 30 transactions)", () => {
    // Only 3 menus
    const fewMenus = fixtureBMenusBeforeShock.slice(0, 3);
    const result1 = calculateMenuEngineering(fewMenus, {
      days: 30,
      totalTransactions: 100,
      asOfDate,
    });
    expect(result1.isDataSufficient).toBe(false);
    expect(result1.insufficientReason).toContain("minimal 4 menu terklasifikasi");

    // 6 menus but only 20 transactions
    const result2 = calculateMenuEngineering(fixtureBMenusBeforeShock, {
      days: 30,
      totalTransactions: 20,
      asOfDate,
    });
    expect(result2.isDataSufficient).toBe(false);
    expect(result2.insufficientReason).toContain("minimal 30 transaksi");
  });

  it("unclassifies new menus (< 14 days old) and zero-sale menus", () => {
    const menusWithEdgeCases: MenuItemEngineeringInput[] = [
      ...fixtureBMenusBeforeShock,
      {
        menuId: "menu-baru",
        menuName: "Menu Baru",
        category: "Baru",
        sellingPrice: "25000",
        hppPenuh: "10000",
        portionsSold: 50,
        createdAt: new Date("2026-10-25T00:00:00Z"), // 6 days ago relative to asOfDate
        hasRecipe: true,
        isCostComplete: true,
      },
      {
        menuId: "menu-no-sales",
        menuName: "Menu Tanpa Pembeli",
        category: "Lainnya",
        sellingPrice: "30000",
        hppPenuh: "12000",
        portionsSold: 0,
        createdAt: pastDate,
        hasRecipe: true,
        isCostComplete: true,
      },
    ];

    const result = calculateMenuEngineering(menusWithEdgeCases, {
      days: 30,
      totalTransactions: 700,
      asOfDate,
    });

    expect(result.classifiedMenus).toHaveLength(6);
    expect(result.unclassifiedMenus).toHaveLength(2);

    const newMenu = result.unclassifiedMenus.find((m) => m.menuId === "menu-baru");
    expect(newMenu?.reason).toBe("NEW_MENU");

    const noSale = result.unclassifiedMenus.find((m) => m.menuId === "menu-no-sales");
    expect(noSale?.reason).toBe("NO_SALES");
  });
});
