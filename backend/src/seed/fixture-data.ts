import { normalizeNameKey } from "../domain/units.js";

export const DEMO_BUSINESS_ID = "demo-business-001";

export const DEMO_BUSINESS_SETTINGS = {
  id: DEMO_BUSINESS_ID,
  name: "Kopi Takar Laba (Demo)",
  isDemo: true,
  targetMarginDefault: "50.00",
  priceRoundingStep: 500,
  expiryWarnDays: 3,
  expectedMonthlyPortions: 1300,
  wastePromoMinMargin: "10.00",
  timezone: "Asia/Jakarta",
};

export const DEMO_OVERHEAD_COSTS = [
  {
    id: "demo-ovh-001",
    name: "Listrik, gas dan air",
    type: "UTILITY" as const,
    monthlyAmount: "900000.00",
    isActive: true,
  },
  {
    id: "demo-ovh-002",
    name: "Penyusutan alat",
    type: "DEPRECIATION" as const,
    monthlyAmount: "300000.00",
    isActive: true,
  },
  {
    id: "demo-ovh-003",
    name: "Biaya lain",
    type: "OTHER" as const,
    monthlyAmount: "360000.00",
    isActive: true,
  },
];

export interface FixtureIngredient {
  id: string;
  name: string;
  nameKey: string;
  category: "MAIN" | "SUPPORT" | "PACKAGING";
  baseUnit: "G" | "ML" | "PCS";
  yieldPercent: string;
  isPerishable: boolean;
  minStockBase: string;
  costPerBase: string;
  units: {
    name: string;
    toBaseFactor: string;
  }[];
}

export const DEMO_INGREDIENTS: FixtureIngredient[] = [
  {
    id: "demo-ing-kopi",
    name: "Biji Kopi",
    nameKey: normalizeNameKey("Biji Kopi"),
    category: "MAIN",
    baseUnit: "G",
    yieldPercent: "100.00",
    isPerishable: false,
    minStockBase: "1000.000",
    costPerBase: "180.000000",
    units: [{ name: "kg", toBaseFactor: "1000.0000" }],
  },
  {
    id: "demo-ing-susu-uht",
    name: "Susu UHT",
    nameKey: normalizeNameKey("Susu UHT"),
    category: "MAIN",
    baseUnit: "ML",
    yieldPercent: "100.00",
    isPerishable: true,
    minStockBase: "2000.000",
    costPerBase: "18.000000",
    units: [{ name: "liter", toBaseFactor: "1000.0000" }],
  },
  {
    id: "demo-ing-susu-oat",
    name: "Susu Oat",
    nameKey: normalizeNameKey("Susu Oat"),
    category: "MAIN",
    baseUnit: "ML",
    yieldPercent: "100.00",
    isPerishable: true,
    minStockBase: "2000.000",
    costPerBase: "20.000000",
    units: [{ name: "liter", toBaseFactor: "1000.0000" }],
  },
  {
    id: "demo-ing-gula-aren",
    name: "Gula Aren Cair",
    nameKey: normalizeNameKey("Gula Aren Cair"),
    category: "MAIN",
    baseUnit: "ML",
    yieldPercent: "100.00",
    isPerishable: false,
    minStockBase: "1000.000",
    costPerBase: "40.000000",
    units: [{ name: "liter", toBaseFactor: "1000.0000" }],
  },
  {
    id: "demo-ing-gula-pasir",
    name: "Gula Pasir",
    nameKey: normalizeNameKey("Gula Pasir"),
    category: "SUPPORT",
    baseUnit: "G",
    yieldPercent: "100.00",
    isPerishable: false,
    minStockBase: "500.000",
    costPerBase: "16.000000",
    units: [{ name: "kg", toBaseFactor: "1000.0000" }],
  },
  {
    id: "demo-ing-teh-celup",
    name: "Teh Celup",
    nameKey: normalizeNameKey("Teh Celup"),
    category: "MAIN",
    baseUnit: "PCS",
    yieldPercent: "100.00",
    isPerishable: false,
    minStockBase: "25.000",
    costPerBase: "400.000000",
    units: [{ name: "kotak", toBaseFactor: "25.0000" }],
  },
  {
    id: "demo-ing-bubuk-matcha",
    name: "Bubuk Matcha",
    nameKey: normalizeNameKey("Bubuk Matcha"),
    category: "MAIN",
    baseUnit: "G",
    yieldPercent: "100.00",
    isPerishable: false,
    minStockBase: "100.000",
    costPerBase: "700.000000",
    units: [{ name: "pack", toBaseFactor: "500.0000" }],
  },
  {
    id: "demo-ing-roti-tawar",
    name: "Roti Tawar",
    nameKey: normalizeNameKey("Roti Tawar"),
    category: "MAIN",
    baseUnit: "PCS",
    yieldPercent: "100.00",
    isPerishable: true,
    minStockBase: "10.000",
    costPerBase: "1500.000000",
    units: [{ name: "bungkus", toBaseFactor: "10.0000" }],
  },
  {
    id: "demo-ing-mentega",
    name: "Mentega",
    nameKey: normalizeNameKey("Mentega"),
    category: "SUPPORT",
    baseUnit: "G",
    yieldPercent: "100.00",
    isPerishable: true,
    minStockBase: "200.000",
    costPerBase: "100.000000",
    units: [{ name: "kg", toBaseFactor: "1000.0000" }],
  },
  {
    id: "demo-ing-meses-coklat",
    name: "Meses Coklat",
    nameKey: normalizeNameKey("Meses Coklat"),
    category: "SUPPORT",
    baseUnit: "G",
    yieldPercent: "100.00",
    isPerishable: false,
    minStockBase: "200.000",
    costPerBase: "80.000000",
    units: [{ name: "kg", toBaseFactor: "1000.0000" }],
  },
  {
    id: "demo-ing-croissant-beku",
    name: "Croissant Beku",
    nameKey: normalizeNameKey("Croissant Beku"),
    category: "MAIN",
    baseUnit: "PCS",
    yieldPercent: "100.00",
    isPerishable: true,
    minStockBase: "10.000",
    costPerBase: "10500.000000",
    units: [{ name: "pack", toBaseFactor: "10.0000" }],
  },
  {
    id: "demo-ing-es-batu",
    name: "Es Batu",
    nameKey: normalizeNameKey("Es Batu"),
    category: "SUPPORT",
    baseUnit: "G",
    yieldPercent: "100.00",
    isPerishable: false,
    minStockBase: "2000.000",
    costPerBase: "6.000000",
    units: [{ name: "karung", toBaseFactor: "10000.0000" }],
  },
  {
    id: "demo-ing-air-minum",
    name: "Air Minum",
    nameKey: normalizeNameKey("Air Minum"),
    category: "SUPPORT",
    baseUnit: "ML",
    yieldPercent: "100.00",
    isPerishable: false,
    minStockBase: "5000.000",
    costPerBase: "0.500000",
    units: [{ name: "galon", toBaseFactor: "19000.0000" }],
  },
  {
    id: "demo-ing-cup-set",
    name: "Cup Set",
    nameKey: normalizeNameKey("Cup Set"),
    category: "PACKAGING",
    baseUnit: "PCS",
    yieldPercent: "100.00",
    isPerishable: false,
    minStockBase: "50.000",
    costPerBase: "700.000000",
    units: [{ name: "slop", toBaseFactor: "50.0000" }],
  },
  {
    id: "demo-ing-kertas-pembungkus",
    name: "Kertas Pembungkus",
    nameKey: normalizeNameKey("Kertas Pembungkus"),
    category: "PACKAGING",
    baseUnit: "PCS",
    yieldPercent: "100.00",
    isPerishable: false,
    minStockBase: "50.000",
    costPerBase: "300.000000",
    units: [{ name: "pack", toBaseFactor: "100.0000" }],
  },
  {
    id: "demo-ing-kotak-kemasan",
    name: "Kotak Kemasan Roti",
    nameKey: normalizeNameKey("Kotak Kemasan Roti"),
    category: "PACKAGING",
    baseUnit: "PCS",
    yieldPercent: "100.00",
    isPerishable: false,
    minStockBase: "50.000",
    costPerBase: "800.000000",
    units: [{ name: "pack", toBaseFactor: "50.0000" }],
  },
];

export interface FixtureRecipeItem {
  ingredientId: string;
  qtyUsableBase: string;
}

export interface FixtureMenu {
  id: string;
  name: string;
  nameKey: string;
  category: string;
  sellingPrice: string;
  targetMargin: string;
  ingredientCostExpected: number;
  fullCostExpected: number;
  targetPortions: number;
  recipes: FixtureRecipeItem[];
}

export const DEMO_MENUS: FixtureMenu[] = [
  {
    id: "demo-menu-kopi-susu",
    name: "Es Kopi Susu Aren",
    nameKey: normalizeNameKey("Es Kopi Susu Aren"),
    category: "Kopi",
    sellingPrice: "18000.00",
    targetMargin: "50.00",
    ingredientCostExpected: 7740,
    fullCostExpected: 8940,
    targetPortions: 400,
    recipes: [
      { ingredientId: "demo-ing-kopi", qtyUsableBase: "18.000" },
      { ingredientId: "demo-ing-susu-uht", qtyUsableBase: "150.000" },
      { ingredientId: "demo-ing-gula-aren", qtyUsableBase: "20.000" },
      { ingredientId: "demo-ing-cup-set", qtyUsableBase: "1.000" },
      { ingredientId: "demo-ing-es-batu", qtyUsableBase: "50.000" },
    ],
  },
  {
    id: "demo-menu-americano",
    name: "Americano",
    nameKey: normalizeNameKey("Americano"),
    category: "Kopi",
    sellingPrice: "15000.00",
    targetMargin: "50.00",
    ingredientCostExpected: 3600,
    fullCostExpected: 4800,
    targetPortions: 400,
    recipes: [
      { ingredientId: "demo-ing-kopi", qtyUsableBase: "14.000" },
      { ingredientId: "demo-ing-air-minum", qtyUsableBase: "160.000" },
      { ingredientId: "demo-ing-cup-set", qtyUsableBase: "1.000" },
      { ingredientId: "demo-ing-es-batu", qtyUsableBase: "50.000" },
    ],
  },
  {
    id: "demo-menu-es-teh",
    name: "Es Teh Manis",
    nameKey: normalizeNameKey("Es Teh Manis"),
    category: "Non-Kopi",
    sellingPrice: "8000.00",
    targetMargin: "50.00",
    ingredientCostExpected: 2000,
    fullCostExpected: 3200,
    targetPortions: 200,
    recipes: [
      { ingredientId: "demo-ing-teh-celup", qtyUsableBase: "2.000" },
      { ingredientId: "demo-ing-gula-pasir", qtyUsableBase: "20.000" },
      { ingredientId: "demo-ing-cup-set", qtyUsableBase: "1.000" },
      { ingredientId: "demo-ing-es-batu", qtyUsableBase: "30.000" },
    ],
  },
  {
    id: "demo-menu-roti-bakar",
    name: "Roti Bakar",
    nameKey: normalizeNameKey("Roti Bakar"),
    category: "Makanan",
    sellingPrice: "16000.00",
    targetMargin: "50.00",
    ingredientCostExpected: 7300,
    fullCostExpected: 8500,
    targetPortions: 170,
    recipes: [
      { ingredientId: "demo-ing-roti-tawar", qtyUsableBase: "2.000" },
      { ingredientId: "demo-ing-mentega", qtyUsableBase: "20.000" },
      { ingredientId: "demo-ing-meses-coklat", qtyUsableBase: "25.000" },
      { ingredientId: "demo-ing-kertas-pembungkus", qtyUsableBase: "1.000" },
    ],
  },
  {
    id: "demo-menu-matcha-latte",
    name: "Matcha Latte",
    nameKey: normalizeNameKey("Matcha Latte"),
    category: "Non-Kopi",
    sellingPrice: "22000.00",
    targetMargin: "50.00",
    ingredientCostExpected: 9300,
    fullCostExpected: 10500,
    targetPortions: 80,
    recipes: [
      { ingredientId: "demo-ing-bubuk-matcha", qtyUsableBase: "8.000" },
      { ingredientId: "demo-ing-susu-oat", qtyUsableBase: "150.000" },
      { ingredientId: "demo-ing-cup-set", qtyUsableBase: "1.000" },
    ],
  },
  {
    id: "demo-menu-croissant",
    name: "Croissant",
    nameKey: normalizeNameKey("Croissant"),
    category: "Makanan",
    sellingPrice: "20000.00",
    targetMargin: "50.00",
    ingredientCostExpected: 11300,
    fullCostExpected: 12500,
    targetPortions: 50,
    recipes: [
      { ingredientId: "demo-ing-croissant-beku", qtyUsableBase: "1.000" },
      { ingredientId: "demo-ing-kotak-kemasan", qtyUsableBase: "1.000" },
    ],
  },
];

export interface FixtureOpeningBatch {
  id: string;
  ingredientId: string;
  daysExpiryOffset: number | null;
  purchaseQty: string;
  purchaseUnit: string;
  purchaseUnitPrice: string;
  initialQtyBase: string;
  remainingQtyBase: string;
  costPerBase: string;
}

export const DEMO_OPENING_BATCHES: FixtureOpeningBatch[] = [
  // Susu UHT: batch A 10.000 ml @ 18/ml expiring H+2
  {
    id: "demo-batch-susu-uht-a",
    ingredientId: "demo-ing-susu-uht",
    daysExpiryOffset: 2,
    purchaseQty: "10.000",
    purchaseUnit: "liter",
    purchaseUnitPrice: "18000.00",
    initialQtyBase: "10000.000",
    remainingQtyBase: "10000.000",
    costPerBase: "18.000000",
  },
  // Croissant Beku: Batch 1: 4 pcs expired yesterday (H-1)
  {
    id: "demo-batch-croissant-expired",
    ingredientId: "demo-ing-croissant-beku",
    daysExpiryOffset: -1,
    purchaseQty: "4.000",
    purchaseUnit: "pcs",
    purchaseUnitPrice: "10500.00",
    initialQtyBase: "4.000",
    remainingQtyBase: "4.000",
    costPerBase: "10500.000000",
  },
  // Croissant Beku: Batch 2: valid batch 50 pcs expiring H+30
  {
    id: "demo-batch-croissant-valid",
    ingredientId: "demo-ing-croissant-beku",
    daysExpiryOffset: 30,
    purchaseQty: "50.000",
    purchaseUnit: "pcs",
    purchaseUnitPrice: "10500.00",
    initialQtyBase: "50.000",
    remainingQtyBase: "50.000",
    costPerBase: "10500.000000",
  },
  // Gula Aren Cair: below minStock (minStock: 1000 ml, remaining: 500 ml)
  {
    id: "demo-batch-gula-aren",
    ingredientId: "demo-ing-gula-aren",
    daysExpiryOffset: 60,
    purchaseQty: "1.000",
    purchaseUnit: "liter",
    purchaseUnitPrice: "40000.00",
    initialQtyBase: "1000.000",
    remainingQtyBase: "500.000",
    costPerBase: "40.000000",
  },
  // Biji Kopi: adequate inventory (5.000 g)
  {
    id: "demo-batch-kopi",
    ingredientId: "demo-ing-kopi",
    daysExpiryOffset: 90,
    purchaseQty: "5.000",
    purchaseUnit: "kg",
    purchaseUnitPrice: "180000.00",
    initialQtyBase: "5000.000",
    remainingQtyBase: "5000.000",
    costPerBase: "180.000000",
  },
  // Susu Oat: adequate inventory (10.000 ml)
  {
    id: "demo-batch-susu-oat",
    ingredientId: "demo-ing-susu-oat",
    daysExpiryOffset: 14,
    purchaseQty: "10.000",
    purchaseUnit: "liter",
    purchaseUnitPrice: "20000.00",
    initialQtyBase: "10000.000",
    remainingQtyBase: "10000.000",
    costPerBase: "20.000000",
  },
  // Gula Pasir: adequate inventory (5.000 g)
  {
    id: "demo-batch-gula-pasir",
    ingredientId: "demo-ing-gula-pasir",
    daysExpiryOffset: 180,
    purchaseQty: "5.000",
    purchaseUnit: "kg",
    purchaseUnitPrice: "16000.00",
    initialQtyBase: "5000.000",
    remainingQtyBase: "5000.000",
    costPerBase: "16.000000",
  },
  // Teh Celup: adequate inventory (200 pcs)
  {
    id: "demo-batch-teh-celup",
    ingredientId: "demo-ing-teh-celup",
    daysExpiryOffset: 180,
    purchaseQty: "8.000",
    purchaseUnit: "kotak",
    purchaseUnitPrice: "10000.00",
    initialQtyBase: "200.000",
    remainingQtyBase: "200.000",
    costPerBase: "400.000000",
  },
  // Bubuk Matcha: adequate inventory (1.000 g)
  {
    id: "demo-batch-bubuk-matcha",
    ingredientId: "demo-ing-bubuk-matcha",
    daysExpiryOffset: 90,
    purchaseQty: "2.000",
    purchaseUnit: "pack",
    purchaseUnitPrice: "350000.00",
    initialQtyBase: "1000.000",
    remainingQtyBase: "1000.000",
    costPerBase: "700.000000",
  },
  // Roti Tawar: adequate inventory (50 pcs)
  {
    id: "demo-batch-roti-tawar",
    ingredientId: "demo-ing-roti-tawar",
    daysExpiryOffset: 5,
    purchaseQty: "5.000",
    purchaseUnit: "bungkus",
    purchaseUnitPrice: "15000.00",
    initialQtyBase: "50.000",
    remainingQtyBase: "50.000",
    costPerBase: "1500.000000",
  },
  // Mentega: adequate inventory (2.000 g)
  {
    id: "demo-batch-mentega",
    ingredientId: "demo-ing-mentega",
    daysExpiryOffset: 60,
    purchaseQty: "2.000",
    purchaseUnit: "kg",
    purchaseUnitPrice: "100000.00",
    initialQtyBase: "2000.000",
    remainingQtyBase: "2000.000",
    costPerBase: "100.000000",
  },
  // Meses Coklat: adequate inventory (2.000 g)
  {
    id: "demo-batch-meses-coklat",
    ingredientId: "demo-ing-meses-coklat",
    daysExpiryOffset: 180,
    purchaseQty: "2.000",
    purchaseUnit: "kg",
    purchaseUnitPrice: "80000.00",
    initialQtyBase: "2000.000",
    remainingQtyBase: "2000.000",
    costPerBase: "80.000000",
  },
  // Es Batu: adequate inventory (50.000 g)
  {
    id: "demo-batch-es-batu",
    ingredientId: "demo-ing-es-batu",
    daysExpiryOffset: 7,
    purchaseQty: "5.000",
    purchaseUnit: "karung",
    purchaseUnitPrice: "60000.00",
    initialQtyBase: "50000.000",
    remainingQtyBase: "50000.000",
    costPerBase: "6.000000",
  },
  // Air Minum: adequate inventory (57.000 ml)
  {
    id: "demo-batch-air-minum",
    ingredientId: "demo-ing-air-minum",
    daysExpiryOffset: 30,
    purchaseQty: "3.000",
    purchaseUnit: "galon",
    purchaseUnitPrice: "9500.00",
    initialQtyBase: "57000.000",
    remainingQtyBase: "57000.000",
    costPerBase: "0.500000",
  },
  // Cup Set: adequate inventory (500 pcs, packaging non-perishable)
  {
    id: "demo-batch-cup-set",
    ingredientId: "demo-ing-cup-set",
    daysExpiryOffset: null,
    purchaseQty: "10.000",
    purchaseUnit: "slop",
    purchaseUnitPrice: "35000.00",
    initialQtyBase: "500.000",
    remainingQtyBase: "500.000",
    costPerBase: "700.000000",
  },
  // Kertas Pembungkus: adequate inventory (500 pcs)
  {
    id: "demo-batch-kertas-pembungkus",
    ingredientId: "demo-ing-kertas-pembungkus",
    daysExpiryOffset: null,
    purchaseQty: "5.000",
    purchaseUnit: "pack",
    purchaseUnitPrice: "30000.00",
    initialQtyBase: "500.000",
    remainingQtyBase: "500.000",
    costPerBase: "300.000000",
  },
  // Kotak Kemasan Roti: adequate inventory (200 pcs)
  {
    id: "demo-batch-kotak-kemasan",
    ingredientId: "demo-ing-kotak-kemasan",
    daysExpiryOffset: null,
    purchaseQty: "4.000",
    purchaseUnit: "pack",
    purchaseUnitPrice: "40000.00",
    initialQtyBase: "200.000",
    remainingQtyBase: "200.000",
    costPerBase: "800.000000",
  },
];
