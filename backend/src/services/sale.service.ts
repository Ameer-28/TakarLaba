import {
  saleRepository,
  SaleRepository,
  type SaleItemInputRow,
} from "../repositories/sale.repo.js";
import { settingsRepository, SettingsRepository } from "../repositories/settings.repo.js";
import { overheadRepository, OverheadRepository } from "../repositories/overhead.repo.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { Decimal } from "decimal.js";
import { startOfDayWIB, endOfDayWIB } from "../lib/date.js";
import type { CreateSaleInput, QuerySaleInput } from "../validation/sale.schema.js";
import {
  mapSaleToDto,
  type BatchAllocationOwnerDto,
  type BatchAllocationCashierDto,
  type SaleItemOwnerDto,
  type SaleItemCashierDto,
  type SaleCashierInfo,
  type SaleOwnerResponseDto,
  type SaleCashierResponseDto,
  type SaleResponseDto,
  type SaleListResponseDto,
  type MovementWithDetails,
  type SaleEntityWithItems,
} from "../dto/sale.dto.js";

export type {
  BatchAllocationOwnerDto,
  BatchAllocationCashierDto,
  SaleItemOwnerDto,
  SaleItemCashierDto,
  SaleCashierInfo,
  SaleOwnerResponseDto,
  SaleCashierResponseDto,
  SaleResponseDto,
  SaleListResponseDto,
  MovementWithDetails,
  SaleEntityWithItems,
};

export class SaleService {
  constructor(
    private repo: SaleRepository = saleRepository,
    private settingsRepo: SettingsRepository = settingsRepository,
    private overheadRepo: OverheadRepository = overheadRepository
  ) {}

  /**
   * Helper to compute active overhead per portion according to BR-04.
   */
  async getOverheadPerPortion(businessId: string): Promise<Decimal> {
    const [activeOverheadSum, business] = await Promise.all([
      this.overheadRepo.sumActiveMonthlyOverhead(businessId),
      this.settingsRepo.findById(businessId),
    ]);

    const expectedPortions =
      business && business.expectedMonthlyPortions > 0 ? business.expectedMonthlyPortions : 1;

    return activeOverheadSum.dividedBy(expectedPortions).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Process a POS checkout sale atomically (POST /api/sales).
   */
  async checkout(
    businessId: string,
    cashierId: string,
    role: "OWNER" | "CASHIER",
    idempotencyKey: string,
    input: CreateSaleInput
  ): Promise<SaleResponseDto> {
    if (!input.items || input.items.length === 0) {
      throw new ValidationError("Pesanan harus memiliki minimal 1 item");
    }

    // Merge duplicate menuIds by summing quantities
    const itemMap = new Map<string, number>();
    for (const item of input.items) {
      const current = itemMap.get(item.menuId) || 0;
      itemMap.set(item.menuId, current + item.qty);
    }

    const mergedItems: SaleItemInputRow[] = [];
    for (const [menuId, qty] of itemMap.entries()) {
      if (qty > 999) {
        throw new ValidationError("Kuantitas total untuk setiap menu tidak boleh melebihi 999");
      }
      mergedItems.push({ menuId, qty });
    }

    const overheadPerPortion = await this.getOverheadPerPortion(businessId);

    const sale = await this.repo.checkoutAtomic({
      businessId,
      cashierId,
      idempotencyKey: idempotencyKey.trim(),
      paymentMethod: input.paymentMethod,
      items: mergedItems,
      overheadPerPortion,
    });

    const detailedSale = await this.repo.findById(businessId, sale.id);
    return this.mapToDto(detailedSale ?? sale, role);
  }

  /**
   * List sales with date, cashier, payment method, and status filters.
   */
  async listSales(
    businessId: string,
    role: "OWNER" | "CASHIER",
    query: QuerySaleInput
  ): Promise<SaleListResponseDto> {
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    let startDate: Date | undefined;
    if (query.startDate) {
      startDate = startOfDayWIB(query.startDate);
    }

    let endDate: Date | undefined;
    if (query.endDate) {
      endDate = endOfDayWIB(query.endDate);
    }

    const { sales, total } = await this.repo.findMany(businessId, {
      startDate,
      endDate,
      status: query.status,
      paymentMethod: query.paymentMethod,
      cashierId: query.cashierId,
      skip,
      take,
    });

    const items = sales.map((s) => this.mapToDto(s, role));
    const totalPages = Math.ceil(total / query.limit);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: totalPages === 0 ? 1 : totalPages,
    };
  }

  /**
   * Get detail of a specific sale by ID.
   */
  async getSaleById(
    businessId: string,
    id: string,
    role: "OWNER" | "CASHIER"
  ): Promise<SaleResponseDto> {
    const sale = await this.repo.findById(businessId, id);
    if (!sale) {
      throw new NotFoundError("Transaksi penjualan tidak ditemukan");
    }

    return this.mapToDto(sale, role);
  }

  /**
   * Strict allowlist DTO mapper enforcing Rule 7 and PRD FR-AUTH-03:
   * Strips all cost fields (ingredientCostActual, overheadAllocated, totalIngredientCost, totalOverhead,
   * grossMargin, marginPercentage, batch costPerBase, batch subtotalCost) from responses returned to CASHIER role.
   */
  mapToDto(sale: SaleEntityWithItems, role: "OWNER" | "CASHIER"): SaleResponseDto {
    return mapSaleToDto(sale, role);
  }
}

export const saleService = new SaleService();
