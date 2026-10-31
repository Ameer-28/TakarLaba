import { Decimal } from "decimal.js";
import { overheadRepository } from "../repositories/overhead.repo.js";
import { settingsRepository } from "../repositories/settings.repo.js";
import { alertService } from "./alert.service.js";
import { NotFoundError } from "../lib/errors.js";
import type { CreateOverheadInput, UpdateOverheadInput } from "../validation/overhead.schema.js";

export class OverheadService {
  constructor(
    private readonly repo = overheadRepository,
    private readonly settingsRepo = settingsRepository,
    private readonly alerts = alertService
  ) {}
  async getOverheads(businessId: string, filter?: { isActive?: boolean }) {
    const [overheads, business] = await Promise.all([
      overheadRepository.findMany(businessId, filter),
      settingsRepository.findById(businessId),
    ]);

    if (!business) {
      throw new NotFoundError("Data usaha tidak ditemukan");
    }

    let activeSum = new Decimal(0);
    const items = overheads.map((item) => {
      const amountDecimal = new Decimal(item.monthlyAmount.toString());
      if (item.isActive) {
        activeSum = activeSum.plus(amountDecimal);
      }
      return {
        id: item.id,
        businessId: item.businessId,
        name: item.name,
        type: item.type,
        monthlyAmount: amountDecimal.toFixed(2),
        isActive: item.isActive,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    const expectedPortions =
      business.expectedMonthlyPortions > 0 ? business.expectedMonthlyPortions : 1;
    // BR-04 & BR-11: Overhead/porsi = Σ biaya bulanan aktif ÷ expectedMonthlyPortions (pembulatan HALF_UP)
    const overheadPerPortion = activeSum.dividedBy(expectedPortions).toFixed(2);

    return {
      items,
      totalMonthlyOverhead: activeSum.toFixed(2),
      expectedMonthlyPortions: business.expectedMonthlyPortions,
      overheadPerPortion,
    };
  }

  async createOverhead(businessId: string, input: CreateOverheadInput) {
    const created = await this.repo.create(businessId, {
      name: input.name,
      type: input.type,
      monthlyAmount: new Decimal(input.monthlyAmount),
      isActive: input.isActive,
    });

    await this.alerts.reevaluateAllAlertsForBusiness(businessId);

    return {
      id: created.id,
      businessId: created.businessId,
      name: created.name,
      type: created.type,
      monthlyAmount: new Decimal(created.monthlyAmount.toString()).toFixed(2),
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateOverhead(businessId: string, id: string, input: UpdateOverheadInput) {
    const existing = await this.repo.findById(businessId, id);
    if (!existing) {
      throw new NotFoundError("Beban overhead tidak ditemukan");
    }

    const updatePayload: {
      name?: string;
      type?: typeof input.type;
      monthlyAmount?: Decimal;
      isActive?: boolean;
    } = {};

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.type !== undefined) updatePayload.type = input.type;
    if (input.monthlyAmount !== undefined) {
      updatePayload.monthlyAmount = new Decimal(input.monthlyAmount);
    }
    if (input.isActive !== undefined) updatePayload.isActive = input.isActive;

    const updated = await this.repo.update(businessId, id, updatePayload);

    await this.alerts.reevaluateAllAlertsForBusiness(businessId);

    return {
      id: updated.id,
      businessId: updated.businessId,
      name: updated.name,
      type: updated.type,
      monthlyAmount: new Decimal(updated.monthlyAmount.toString()).toFixed(2),
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteOverhead(businessId: string, id: string) {
    const existing = await this.repo.findById(businessId, id);
    if (!existing) {
      throw new NotFoundError("Beban overhead tidak ditemukan");
    }

    await this.repo.delete(businessId, id);
    await this.alerts.reevaluateAllAlertsForBusiness(businessId);
    return { success: true };
  }
}

export const overheadService = new OverheadService();
