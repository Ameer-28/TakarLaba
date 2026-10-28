import { Decimal } from "decimal.js";
import { settingsRepository } from "../repositories/settings.repo.js";
import { NotFoundError } from "../lib/errors.js";
import type { UpdateSettingsInput } from "../validation/settings.schema.js";

export class SettingsService {
  async getSettings(businessId: string) {
    const business = await settingsRepository.findById(businessId);
    if (!business) {
      throw new NotFoundError("Data usaha tidak ditemukan");
    }

    return {
      id: business.id,
      name: business.name,
      isDemo: business.isDemo,
      targetMarginDefault: business.targetMarginDefault.toString(),
      priceRoundingStep: business.priceRoundingStep,
      expectedMonthlyPortions: business.expectedMonthlyPortions,
      expiryWarnDays: business.expiryWarnDays,
      wastePromoMinMargin: business.wastePromoMinMargin.toString(),
      timezone: business.timezone,
      createdAt: business.createdAt.toISOString(),
    };
  }

  async updateSettings(businessId: string, input: UpdateSettingsInput) {
    const existing = await settingsRepository.findById(businessId);
    if (!existing) {
      throw new NotFoundError("Data usaha tidak ditemukan");
    }

    const updateData: {
      name?: string;
      targetMarginDefault?: Decimal;
      priceRoundingStep?: number;
      expectedMonthlyPortions?: number;
      expiryWarnDays?: number;
      wastePromoMinMargin?: Decimal;
      timezone?: string;
    } = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.targetMarginDefault !== undefined) {
      updateData.targetMarginDefault = new Decimal(input.targetMarginDefault);
    }
    if (input.priceRoundingStep !== undefined) {
      updateData.priceRoundingStep = input.priceRoundingStep;
    }
    if (input.expectedMonthlyPortions !== undefined) {
      updateData.expectedMonthlyPortions = input.expectedMonthlyPortions;
    }
    if (input.expiryWarnDays !== undefined) {
      updateData.expiryWarnDays = input.expiryWarnDays;
    }
    if (input.wastePromoMinMargin !== undefined) {
      updateData.wastePromoMinMargin = new Decimal(input.wastePromoMinMargin);
    }
    if (input.timezone !== undefined) updateData.timezone = input.timezone;

    const updated = await settingsRepository.update(businessId, updateData);

    return {
      id: updated.id,
      name: updated.name,
      isDemo: updated.isDemo,
      targetMarginDefault: updated.targetMarginDefault.toString(),
      priceRoundingStep: updated.priceRoundingStep,
      expectedMonthlyPortions: updated.expectedMonthlyPortions,
      expiryWarnDays: updated.expiryWarnDays,
      wastePromoMinMargin: updated.wastePromoMinMargin.toString(),
      timezone: updated.timezone,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}

export const settingsService = new SettingsService();
