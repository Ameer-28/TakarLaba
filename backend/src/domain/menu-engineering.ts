import { Decimal } from "decimal.js";
import { safeDecimal, type DecimalValue } from "../lib/money.js";
import { startOfDayWIB, todayWIB } from "../lib/date.js";

export type MenuQuadrant = "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";

export interface MenuItemEngineeringInput {
  menuId: string;
  menuName: string;
  category: string | null;
  sellingPrice: DecimalValue;
  hppPenuh: DecimalValue | null; // Full replacement cost (null if incomplete)
  portionsSold: number;
  createdAt: Date | string;
  hasRecipe: boolean;
  isCostComplete: boolean;
  exclusiveIngredientNames?: string[];
  exclusiveIngredientStockValue?: DecimalValue;
}

export interface MenuEngineeringConfig {
  days: number;
  totalTransactions: number;
  priceRoundingStep?: number;
  asOfDate?: Date | string; // defaults to today WIB
}

export interface MenuEngineeringRecommendation {
  type: MenuQuadrant;
  title: string;
  description: string;
  actionMetric?: {
    label: string;
    value: string;
  };
}

export interface ClassifiedMenuItem {
  menuId: string;
  menuName: string;
  category: string | null;
  sellingPrice: Decimal;
  hppPenuh: Decimal;
  marginKontribusi: Decimal;
  portionsSold: number;
  popularitySharePercent: Decimal;
  quadrant: MenuQuadrant;
  recommendation: MenuEngineeringRecommendation;
}

export interface UnclassifiedMenuItem {
  menuId: string;
  menuName: string;
  category: string | null;
  reason: "NEW_MENU" | "NO_SALES" | "NO_RECIPE" | "INCOMPLETE_COST";
  description: string;
}

export interface MenuEngineeringResult {
  isDataSufficient: boolean;
  insufficientReason?: string;
  days: number;
  totalTransactions: number;
  totalClassifiedPortions: number;
  popularityThresholdPortions: Decimal; // 0.7 * (1/n) * totalPortions
  weightedMarginThreshold: Decimal; // sum(CM * portions) / sum(portions)
  classifiedMenus: ClassifiedMenuItem[];
  unclassifiedMenus: UnclassifiedMenuItem[];
}

/**
 * Pure domain logic for Menu Engineering (Kasavana & Smith) (BR-10, FR-MEG-01).
 *
 * Thresholds:
 * - Popularity threshold = 0.7 * (1 / n) * totalPortions
 * - Weighted contribution margin threshold = sum(CM_i * portions_i) / sum(portions_i)
 *
 * Quadrants:
 * - STAR: portions >= popularityThreshold && CM >= marginThreshold
 * - PLOWHORSE: portions >= popularityThreshold && CM < marginThreshold
 * - PUZZLE: portions < popularityThreshold && CM >= marginThreshold
 * - DOG: portions < popularityThreshold && CM < marginThreshold
 */
export function calculateMenuEngineering(
  menus: MenuItemEngineeringInput[],
  config: MenuEngineeringConfig
): MenuEngineeringResult {
  const { days, totalTransactions, priceRoundingStep = 500 } = config;
  const asOf = config.asOfDate ? startOfDayWIB(config.asOfDate) : todayWIB();

  const classifiedCandidates: Array<{
    item: MenuItemEngineeringInput;
    sellingPrice: Decimal;
    hppPenuh: Decimal;
    marginKontribusi: Decimal;
  }> = [];

  const unclassifiedMenus: UnclassifiedMenuItem[] = [];

  // Filter candidates and unclassified reasons
  for (const menu of menus) {
    if (!menu.hasRecipe) {
      unclassifiedMenus.push({
        menuId: menu.menuId,
        menuName: menu.menuName,
        category: menu.category,
        reason: "NO_RECIPE",
        description: "Menu belum memiliki resep bahan baku",
      });
      continue;
    }

    if (!menu.isCostComplete || menu.hppPenuh === null) {
      unclassifiedMenus.push({
        menuId: menu.menuId,
        menuName: menu.menuName,
        category: menu.category,
        reason: "INCOMPLETE_COST",
        description: "Harga beli bahan belum lengkap",
      });
      continue;
    }

    // Check menu age: less than 14 days old is marked NEW
    const createdDate = startOfDayWIB(menu.createdAt);
    const ageInDays = Math.floor((asOf.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    if (ageInDays < 14) {
      unclassifiedMenus.push({
        menuId: menu.menuId,
        menuName: menu.menuName,
        category: menu.category,
        reason: "NEW_MENU",
        description: `Menu baru (< 14 hari, ${ageInDays} hari)`,
      });
      continue;
    }

    if (menu.portionsSold <= 0) {
      unclassifiedMenus.push({
        menuId: menu.menuId,
        menuName: menu.menuName,
        category: menu.category,
        reason: "NO_SALES",
        description: "Belum ada penjualan dalam periode ini",
      });
      continue;
    }

    const sellingPrice = safeDecimal(menu.sellingPrice);
    const hppPenuh = safeDecimal(menu.hppPenuh);
    const marginKontribusi = sellingPrice.minus(hppPenuh);

    classifiedCandidates.push({
      item: menu,
      sellingPrice,
      hppPenuh,
      marginKontribusi,
    });
  }

  const n = classifiedCandidates.length;

  // Data sufficiency check: min 4 classified menus and min 30 transactions
  const hasEnoughMenus = n >= 4;
  const hasEnoughTransactions = totalTransactions >= 30;
  const isDataSufficient = hasEnoughMenus && hasEnoughTransactions;

  let insufficientReason: string | undefined;
  if (!isDataSufficient) {
    if (!hasEnoughMenus && !hasEnoughTransactions) {
      insufficientReason = `Data belum cukup: membutuhkan minimal 4 menu terklasifikasi (tersedia ${n}) dan minimal 30 transaksi (tersedia ${totalTransactions}).`;
    } else if (!hasEnoughMenus) {
      insufficientReason = `Data belum cukup: membutuhkan minimal 4 menu terklasifikasi (tersedia ${n}).`;
    } else {
      insufficientReason = `Data belum cukup: membutuhkan minimal 30 transaksi penjualan (tersedia ${totalTransactions}).`;
    }
  }

  if (n === 0) {
    return {
      isDataSufficient: false,
      insufficientReason,
      days,
      totalTransactions,
      totalClassifiedPortions: 0,
      popularityThresholdPortions: new Decimal(0),
      weightedMarginThreshold: new Decimal(0),
      classifiedMenus: [],
      unclassifiedMenus,
    };
  }

  // Calculate totals for classified menus
  let totalClassifiedPortions = 0;
  let totalContributionMargin = new Decimal(0);

  for (const cand of classifiedCandidates) {
    totalClassifiedPortions += cand.item.portionsSold;
    totalContributionMargin = totalContributionMargin.plus(
      cand.marginKontribusi.times(cand.item.portionsSold)
    );
  }

  // Ambang popularitas = 0.7 * (1 / n) * totalPortions
  const popularityThresholdPortions = new Decimal(0.7).dividedBy(n).times(totalClassifiedPortions);

  // Ambang margin tertimbang = sum(CM_i * portions_i) / sum(portions_i)
  const weightedMarginThreshold =
    totalClassifiedPortions > 0
      ? totalContributionMargin.dividedBy(totalClassifiedPortions)
      : new Decimal(0);

  const classifiedMenus: ClassifiedMenuItem[] = classifiedCandidates.map((cand) => {
    const isPopular = cand.item.portionsSold >= popularityThresholdPortions.toNumber();
    const isHighMargin = cand.marginKontribusi.greaterThanOrEqualTo(weightedMarginThreshold);

    let quadrant: MenuQuadrant;
    if (isPopular && isHighMargin) {
      quadrant = "STAR";
    } else if (isPopular && !isHighMargin) {
      quadrant = "PLOWHORSE";
    } else if (!isPopular && isHighMargin) {
      quadrant = "PUZZLE";
    } else {
      quadrant = "DOG";
    }

    const popularitySharePercent =
      totalClassifiedPortions > 0
        ? new Decimal(cand.item.portionsSold).dividedBy(totalClassifiedPortions).times(100)
        : new Decimal(0);

    const recommendation = buildRecommendation(
      quadrant,
      cand.marginKontribusi,
      weightedMarginThreshold,
      cand.item.exclusiveIngredientNames,
      cand.item.exclusiveIngredientStockValue,
      priceRoundingStep
    );

    return {
      menuId: cand.item.menuId,
      menuName: cand.item.menuName,
      category: cand.item.category,
      sellingPrice: cand.sellingPrice,
      hppPenuh: cand.hppPenuh,
      marginKontribusi: cand.marginKontribusi,
      portionsSold: cand.item.portionsSold,
      popularitySharePercent,
      quadrant,
      recommendation,
    };
  });

  return {
    isDataSufficient,
    insufficientReason,
    days,
    totalTransactions,
    totalClassifiedPortions,
    popularityThresholdPortions,
    weightedMarginThreshold,
    classifiedMenus,
    unclassifiedMenus,
  };
}

/**
 * Generates dynamic calculated recommendation based on quadrant and financial formulas (BR-10).
 */
function buildRecommendation(
  quadrant: MenuQuadrant,
  cm: Decimal,
  weightedMarginThreshold: Decimal,
  exclusiveIngredientNames?: string[],
  exclusiveStockValue?: DecimalValue,
  step = 500
): MenuEngineeringRecommendation {
  switch (quadrant) {
    case "STAR":
      return {
        type: "STAR",
        title: "Pertahankan Kualitas & Penjualan",
        description:
          "Menu primadona dengan popularitas tinggi dan margin prima. Jaga konsistensi rasa, kualitas takaran, dan ketersediaan stok bahan baku.",
      };

    case "PLOWHORSE": {
      // Breakeven drop in sales for price increase of Rp1.000: X = 1 - CM / (CM + 1000)
      const kenaikan = new Decimal(1000);
      const newCm = cm.plus(kenaikan);
      let dropPercent = new Decimal(0);
      if (newCm.greaterThan(0)) {
        dropPercent = new Decimal(1).minus(cm.dividedBy(newCm)).times(100);
      }
      const formattedPercent = dropPercent.toFixed(1);

      return {
        type: "PLOWHORSE",
        title: "Evaluasi Harga Jual atau Efisiensi Biaya",
        description: `Menu sangat laris namun margin per porsi di bawah rata-rata. Naik Rp1.000 tetap lebih untung selama penurunan penjualan tidak melebihi ${formattedPercent}%.`,
        actionMetric: {
          label: "Batas Toleransi Penurunan Penjualan (Naik Rp1.000)",
          value: `${formattedPercent}%`,
        },
      };
    }

    case "PUZZLE": {
      // Diskon maksimum aman = CM - ambangMargin (dibulatkan ke bawah ke step terdekat)
      let safeDiscount = cm.minus(weightedMarginThreshold);
      if (safeDiscount.greaterThan(0)) {
        safeDiscount = safeDiscount.dividedBy(step).floor().times(step);
      } else {
        safeDiscount = new Decimal(0);
      }

      return {
        type: "PUZZLE",
        title: "Dorong Promosi & Rekomendasi Kasir",
        description: `Margin sangat menguntungkan tetapi penjualan masih rendah. Tampilkan prompt rekomendasi kasir di POS atau tawarkan bundling dengan diskon aman hingga Rp${safeDiscount.toNumber().toLocaleString("id-ID")}.`,
        actionMetric: {
          label: "Diskon Maksimal Aman per Porsi",
          value: `Rp${safeDiscount.toNumber().toLocaleString("id-ID")}`,
        },
      };
    }

    case "DOG": {
      const hasExclusive =
        exclusiveIngredientNames &&
        exclusiveIngredientNames.length > 0 &&
        exclusiveStockValue !== undefined &&
        safeDecimal(exclusiveStockValue).greaterThan(0);

      if (hasExclusive) {
        const val = safeDecimal(exclusiveStockValue!).toNumber().toLocaleString("id-ID");
        return {
          type: "DOG",
          title: "Evaluasi Menu & Habiskan Sisa Stok",
          description: `Popularitas dan margin rendah. Bahan khusus (${exclusiveIngredientNames!.join(", ")}) bernilai stok Rp${val}. Habiskan stok terlebih dahulu sebelum mengganti menu.`,
          actionMetric: {
            label: "Nilai Stok Bahan Khusus",
            value: `Rp${val}`,
          },
        };
      }

      return {
        type: "DOG",
        title: "Evaluasi Eksistensi Menu",
        description:
          "Menu kurang diminati dan margin tipis. Pertimbangkan modifikasi takaran resep, perbaikan nama/foto, atau ganti dengan menu baru.",
      };
    }
  }
}
