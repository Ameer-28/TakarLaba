import { prisma } from "../lib/db.js";
import { Decimal } from "decimal.js";

export interface UpdateSettingsData {
  name?: string;
  targetMarginDefault?: Decimal;
  priceRoundingStep?: number;
  expectedMonthlyPortions?: number;
  expiryWarnDays?: number;
  wastePromoMinMargin?: Decimal;
  timezone?: string;
}

export class SettingsRepository {
  async findById(businessId: string) {
    return prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        isDemo: true,
        targetMarginDefault: true,
        priceRoundingStep: true,
        expectedMonthlyPortions: true,
        expiryWarnDays: true,
        wastePromoMinMargin: true,
        timezone: true,
        createdAt: true,
      },
    });
  }

  async update(businessId: string, data: UpdateSettingsData) {
    const updatePayload: {
      name?: string;
      targetMarginDefault?: string;
      priceRoundingStep?: number;
      expectedMonthlyPortions?: number;
      expiryWarnDays?: number;
      wastePromoMinMargin?: string;
      timezone?: string;
    } = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.targetMarginDefault !== undefined) {
      updatePayload.targetMarginDefault = data.targetMarginDefault.toFixed(2);
    }
    if (data.priceRoundingStep !== undefined) {
      updatePayload.priceRoundingStep = data.priceRoundingStep;
    }
    if (data.expectedMonthlyPortions !== undefined) {
      updatePayload.expectedMonthlyPortions = data.expectedMonthlyPortions;
    }
    if (data.expiryWarnDays !== undefined) {
      updatePayload.expiryWarnDays = data.expiryWarnDays;
    }
    if (data.wastePromoMinMargin !== undefined) {
      updatePayload.wastePromoMinMargin = data.wastePromoMinMargin.toFixed(2);
    }
    if (data.timezone !== undefined) updatePayload.timezone = data.timezone;

    return prisma.business.update({
      where: { id: businessId },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        isDemo: true,
        targetMarginDefault: true,
        priceRoundingStep: true,
        expectedMonthlyPortions: true,
        expiryWarnDays: true,
        wastePromoMinMargin: true,
        timezone: true,
        createdAt: true,
      },
    });
  }
}

export const settingsRepository = new SettingsRepository();
