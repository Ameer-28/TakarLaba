import { prisma } from "../lib/db.js";
import { Decimal } from "decimal.js";
import type { OverheadType } from "../generated/prisma/enums.js";

export interface CreateOverheadData {
  name: string;
  type: OverheadType;
  monthlyAmount: Decimal;
  isActive?: boolean;
}

export interface UpdateOverheadData {
  name?: string;
  type?: OverheadType;
  monthlyAmount?: Decimal;
  isActive?: boolean;
}

export class OverheadRepository {
  async findMany(businessId: string, filter?: { isActive?: boolean }) {
    const where: { businessId: string; isActive?: boolean } = { businessId };
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    return prisma.overheadCost.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
  }

  async findById(businessId: string, id: string) {
    return prisma.overheadCost.findFirst({
      where: { id, businessId },
    });
  }

  async create(businessId: string, data: CreateOverheadData) {
    return prisma.overheadCost.create({
      data: {
        businessId,
        name: data.name.trim(),
        type: data.type,
        monthlyAmount: data.monthlyAmount.toFixed(2),
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(businessId: string, id: string, data: UpdateOverheadData) {
    const updateData: {
      name?: string;
      type?: OverheadType;
      monthlyAmount?: string;
      isActive?: boolean;
    } = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.monthlyAmount !== undefined) {
      updateData.monthlyAmount = data.monthlyAmount.toFixed(2);
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.overheadCost.update({
      where: { id, businessId },
      data: updateData,
    });
  }

  async delete(businessId: string, id: string) {
    return prisma.overheadCost.delete({
      where: { id, businessId },
    });
  }

  async sumActiveMonthlyOverhead(businessId: string): Promise<Decimal> {
    const activeCosts = await prisma.overheadCost.findMany({
      where: { businessId, isActive: true },
      select: { monthlyAmount: true },
    });

    let sum = new Decimal(0);
    for (const cost of activeCosts) {
      sum = sum.plus(new Decimal(cost.monthlyAmount.toString()));
    }
    return sum;
  }
}

export const overheadRepository = new OverheadRepository();
