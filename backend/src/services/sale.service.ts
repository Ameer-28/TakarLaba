import {
  saleRepository,
  SaleRepository,
  type SaleItemInputRow,
} from "../repositories/sale.repo.js";
import { settingsRepository, SettingsRepository } from "../repositories/settings.repo.js";
import { overheadRepository, OverheadRepository } from "../repositories/overhead.repo.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { Decimal } from "decimal.js";
import type { CreateSaleInput } from "../validation/sale.schema.js";
import type { Sale, SaleItem } from "../generated/prisma/client.js";

export interface SaleItemOwnerDto {
  id: string;
  menuId: string;
  menuNameSnapshot: string;
  qty: number;
  unitPrice: string;
  ingredientCostActual: string;
  overheadAllocated: string;
}

export interface SaleItemCashierDto {
  id: string;
  menuId: string;
  menuNameSnapshot: string;
  qty: number;
  unitPrice: string;
}

export interface SaleOwnerResponseDto {
  id: string;
  invoiceNo: string;
  idempotencyKey: string;
  soldAt: Date;
  cashierId: string;
  paymentMethod: string;
  totalAmount: string;
  totalIngredientCost: string;
  totalOverhead: string;
  status: string;
  items: SaleItemOwnerDto[];
}

export interface SaleCashierResponseDto {
  id: string;
  invoiceNo: string;
  idempotencyKey: string;
  soldAt: Date;
  cashierId: string;
  paymentMethod: string;
  totalAmount: string;
  status: string;
  items: SaleItemCashierDto[];
}

export type SaleResponseDto = SaleOwnerResponseDto | SaleCashierResponseDto;

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
    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw new ValidationError("Header Idempotency-Key wajib disertakan");
    }

    if (idempotencyKey.length > 128) {
      throw new ValidationError("Idempotency-Key maksimal 128 karakter");
    }

    // Merge duplicate menuId entries by summing quantities
    const mergedMap = new Map<string, number>();
    for (const it of input.items) {
      const current = mergedMap.get(it.menuId) ?? 0;
      mergedMap.set(it.menuId, current + it.qty);
    }

    const mergedItems: SaleItemInputRow[] = [];
    for (const [menuId, qty] of mergedMap.entries()) {
      if (qty > 999) {
        throw new ValidationError(`Kuantitas total untuk menu melebihi batas maksimal (999 porsi)`);
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

    return this.mapToDto(sale, role);
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
   * Strips all cost fields (ingredientCostActual, overheadAllocated, totalIngredientCost, totalOverhead)
   * from responses returned to CASHIER role.
   */
  mapToDto(sale: Sale & { items: SaleItem[] }, role: "OWNER" | "CASHIER"): SaleResponseDto {
    if (role === "CASHIER") {
      return {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        idempotencyKey: sale.idempotencyKey,
        soldAt: sale.soldAt,
        cashierId: sale.cashierId,
        paymentMethod: sale.paymentMethod,
        totalAmount: new Decimal(sale.totalAmount.toString()).toFixed(2),
        status: sale.status,
        items: sale.items.map((item) => ({
          id: item.id,
          menuId: item.menuId,
          menuNameSnapshot: item.menuNameSnapshot,
          qty: item.qty,
          unitPrice: new Decimal(item.unitPrice.toString()).toFixed(2),
        })),
      };
    }

    // Role is OWNER: Expose cost & margin snapshot
    return {
      id: sale.id,
      invoiceNo: sale.invoiceNo,
      idempotencyKey: sale.idempotencyKey,
      soldAt: sale.soldAt,
      cashierId: sale.cashierId,
      paymentMethod: sale.paymentMethod,
      totalAmount: new Decimal(sale.totalAmount.toString()).toFixed(2),
      totalIngredientCost: new Decimal(sale.totalIngredientCost.toString()).toFixed(2),
      totalOverhead: new Decimal(sale.totalOverhead.toString()).toFixed(2),
      status: sale.status,
      items: sale.items.map((item) => ({
        id: item.id,
        menuId: item.menuId,
        menuNameSnapshot: item.menuNameSnapshot,
        qty: item.qty,
        unitPrice: new Decimal(item.unitPrice.toString()).toFixed(2),
        ingredientCostActual: new Decimal(item.ingredientCostActual.toString()).toFixed(2),
        overheadAllocated: new Decimal(item.overheadAllocated.toString()).toFixed(2),
      })),
    };
  }
}

export const saleService = new SaleService();
