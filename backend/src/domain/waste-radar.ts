import { Decimal } from "decimal.js";
import {
  safeDecimal,
  toMoney,
  toPercent,
  formatMoney,
  formatQuantity,
  formatPercent,
  type DecimalValue,
} from "../lib/money.js";
import { roundUpToStep } from "./pricing.js";
import { todayWIBString } from "../lib/date.js";

export interface ExpiringBatchInput {
  batchId: string;
  ingredientId: string;
  ingredientName: string;
  category: string | null;
  remainingQtyBase: DecimalValue;
  unit: string;
  costPerBase: DecimalValue;
  expiryDate: Date | string;
}

export interface RelatedMenuCostInput {
  menuId: string;
  menuName: string;
  category: string | null;
  sellingPrice: DecimalValue;
  hppPenuh: DecimalValue;
}

export interface WasteRadarConfig {
  warnDays: number;
  wastePromoMinMarginPercent: DecimalValue; // e.g. 10.00 (10%)
  priceRoundingStep?: number; // e.g. 500
  referenceDate?: Date;
}

export interface WasteRadarRelatedMenuDTO {
  menuId: string;
  menuName: string;
  category: string | null;
  sellingPrice: string;
  hppPenuh: string;
  currentMarginPercent: string;
  promoFloorPrice: string;
  maxDiscountAmount: string;
  maxDiscountPercent: string;
  promoMarginPercent: string;
}

export interface WasteRadarItemDTO {
  batchId: string;
  ingredientId: string;
  ingredientName: string;
  category: string | null;
  remainingQty: string;
  unit: string;
  costPerBase: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: "EXPIRED" | "EXPIRING_SOON";
  riskValue: string;
  relatedMenus: WasteRadarRelatedMenuDTO[];
}

export interface WasteRadarSummaryDTO {
  totalRiskValue: string;
  totalExpiringBatches: number;
  totalImpactedMenus: number;
  warnDays: number;
  wastePromoMinMarginPercent: string;
}

export interface WasteRadarResultDTO {
  summary: WasteRadarSummaryDTO;
  items: WasteRadarItemDTO[];
}

/**
 * Calculates promo floor price and max discount for a menu under FR-WST-01:
 * - hargaLantai = ceil( HPP Penuh / (1 - wastePromoMinMargin) / step ) * step
 * - batasDiskon = max( 0, hargaJual - hargaLantai )
 */
export function calculateMenuPromoDiscount(
  hppPenuh: DecimalValue,
  sellingPrice: DecimalValue,
  wastePromoMinMarginPercent: DecimalValue,
  priceRoundingStep: number = 500
): {
  promoFloorPrice: Decimal;
  maxDiscountAmount: Decimal;
  maxDiscountPercent: Decimal;
  promoMarginPercent: Decimal;
  currentMarginPercent: Decimal;
} {
  const decHppPenuh = safeDecimal(hppPenuh);
  const decSellingPrice = safeDecimal(sellingPrice);
  const decMinMargin = safeDecimal(wastePromoMinMarginPercent);

  const marginFraction = decMinMargin.dividedBy(100);
  const divisor = new Decimal(1).minus(marginFraction);

  const rawFloor =
    divisor.isPositive() && !divisor.isZero() ? decHppPenuh.dividedBy(divisor) : decHppPenuh;

  const promoFloorPrice = roundUpToStep(rawFloor, priceRoundingStep);
  const maxDiscountAmount = Decimal.max(0, decSellingPrice.minus(promoFloorPrice));

  const maxDiscountPercent =
    decSellingPrice.isPositive() && !decSellingPrice.isZero()
      ? toPercent(maxDiscountAmount.dividedBy(decSellingPrice).times(100))
      : new Decimal(0);

  const promoMarginPercent =
    promoFloorPrice.isPositive() && !promoFloorPrice.isZero()
      ? toPercent(promoFloorPrice.minus(decHppPenuh).dividedBy(promoFloorPrice).times(100))
      : new Decimal(0);

  const currentMarginPercent =
    decSellingPrice.isPositive() && !decSellingPrice.isZero()
      ? toPercent(decSellingPrice.minus(decHppPenuh).dividedBy(decSellingPrice).times(100))
      : new Decimal(0);

  return {
    promoFloorPrice,
    maxDiscountAmount,
    maxDiscountPercent,
    promoMarginPercent,
    currentMarginPercent,
  };
}

/**
 * Pure domain function to build Waste Radar analytics (FR-WST-01).
 * Evaluates expiring/expired batches, computes financial risk value,
 * and identifies actionable menu promotion suggestions with safe discount thresholds.
 */
export function buildWasteRadar(
  batches: ExpiringBatchInput[],
  ingredientMenuMap: Map<string, RelatedMenuCostInput[]>,
  config: WasteRadarConfig
): WasteRadarResultDTO {
  const {
    warnDays,
    wastePromoMinMarginPercent,
    priceRoundingStep = 500,
    referenceDate = new Date(),
  } = config;

  const todayStr = todayWIBString(referenceDate);
  const todayDate = new Date(`${todayStr}T00:00:00.000+07:00`);

  let totalRiskDecimal = new Decimal(0);
  const impactedMenuIds = new Set<string>();

  const items: WasteRadarItemDTO[] = batches.map((batch) => {
    const rawExp = batch.expiryDate instanceof Date ? batch.expiryDate : new Date(batch.expiryDate);
    const expDateStr = todayWIBString(rawExp);
    const expDate = new Date(`${expDateStr}T00:00:00.000+07:00`);

    const diffMs = expDate.getTime() - todayDate.getTime();
    const daysUntilExpiry = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const status: "EXPIRED" | "EXPIRING_SOON" = daysUntilExpiry < 0 ? "EXPIRED" : "EXPIRING_SOON";

    const qty = safeDecimal(batch.remainingQtyBase);
    const costPerBase = safeDecimal(batch.costPerBase);
    const riskValue = toMoney(qty.times(costPerBase));
    totalRiskDecimal = totalRiskDecimal.plus(riskValue);

    const relatedMenusInput = ingredientMenuMap.get(batch.ingredientId) ?? [];
    const relatedMenus: WasteRadarRelatedMenuDTO[] = relatedMenusInput.map((menu) => {
      impactedMenuIds.add(menu.menuId);
      const discount = calculateMenuPromoDiscount(
        menu.hppPenuh,
        menu.sellingPrice,
        wastePromoMinMarginPercent,
        priceRoundingStep
      );

      return {
        menuId: menu.menuId,
        menuName: menu.menuName,
        category: menu.category,
        sellingPrice: formatMoney(menu.sellingPrice),
        hppPenuh: formatMoney(menu.hppPenuh),
        currentMarginPercent: formatPercent(discount.currentMarginPercent),
        promoFloorPrice: formatMoney(discount.promoFloorPrice),
        maxDiscountAmount: formatMoney(discount.maxDiscountAmount),
        maxDiscountPercent: formatPercent(discount.maxDiscountPercent),
        promoMarginPercent: formatPercent(discount.promoMarginPercent),
      };
    });

    return {
      batchId: batch.batchId,
      ingredientId: batch.ingredientId,
      ingredientName: batch.ingredientName,
      category: batch.category,
      remainingQty: formatQuantity(batch.remainingQtyBase),
      unit: batch.unit,
      costPerBase: formatMoney(batch.costPerBase),
      expiryDate: expDateStr,
      daysUntilExpiry,
      status,
      riskValue: formatMoney(riskValue),
      relatedMenus,
    };
  });

  // Sort items: EXPIRED first, then by daysUntilExpiry ascending (soonest to expire first)
  items.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  const summary: WasteRadarSummaryDTO = {
    totalRiskValue: formatMoney(totalRiskDecimal),
    totalExpiringBatches: items.length,
    totalImpactedMenus: impactedMenuIds.size,
    warnDays,
    wastePromoMinMarginPercent: formatPercent(wastePromoMinMarginPercent),
  };

  return { summary, items };
}
