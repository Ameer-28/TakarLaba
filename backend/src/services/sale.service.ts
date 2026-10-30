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

export interface BatchAllocationOwnerDto {
  movementId: string;
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  batchId: string | null;
  batchExpiryDate: Date | null;
  qtyDeducted: string;
  costPerBase: string;
  subtotalCost: string;
}

export interface BatchAllocationCashierDto {
  movementId: string;
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  batchId: string | null;
  batchExpiryDate: Date | null;
  qtyDeducted: string;
}

export interface SaleItemOwnerDto {
  id: string;
  menuId: string;
  menuNameSnapshot: string;
  qty: number;
  unitPrice: string;
  subtotalPrice: string;
  ingredientCostActual: string;
  overheadAllocated: string;
  grossMargin: string;
  marginPercentage: string;
  batchAllocations?: BatchAllocationOwnerDto[];
}

export interface SaleItemCashierDto {
  id: string;
  menuId: string;
  menuNameSnapshot: string;
  qty: number;
  unitPrice: string;
  subtotalPrice: string;
  batchAllocations?: BatchAllocationCashierDto[];
}

export interface SaleCashierInfo {
  id: string;
  name: string;
  role: string | null;
}

export interface SaleOwnerResponseDto {
  id: string;
  invoiceNo: string;
  idempotencyKey: string;
  soldAt: Date;
  cashierId: string;
  cashier?: SaleCashierInfo;
  paymentMethod: string;
  totalAmount: string;
  totalIngredientCost: string;
  totalOverhead: string;
  grossMargin: string;
  marginPercentage: string;
  status: string;
  items: SaleItemOwnerDto[];
}

export interface SaleCashierResponseDto {
  id: string;
  invoiceNo: string;
  idempotencyKey: string;
  soldAt: Date;
  cashierId: string;
  cashier?: SaleCashierInfo;
  paymentMethod: string;
  totalAmount: string;
  status: string;
  items: SaleItemCashierDto[];
}

export type SaleResponseDto = SaleOwnerResponseDto | SaleCashierResponseDto;

export interface SaleListResponseDto {
  items: SaleResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MovementWithDetails {
  id: string;
  ingredientId: string;
  batchId: string | null;
  qtyBaseDelta: Decimal | string | number;
  costPerBase: Decimal | string | number;
  refType: string | null;
  refId: string | null;
  ingredient?: {
    id: string;
    name: string;
    baseUnit: string;
  } | null;
  batch?: {
    id: string;
    expiryDate: Date | null;
    purchaseUnit: string;
    purchaseUnitPrice: Decimal | string | number;
    costPerBase: Decimal | string | number;
  } | null;
}

export interface SaleEntityWithItems {
  id: string;
  invoiceNo: string;
  idempotencyKey: string;
  soldAt: Date;
  cashierId: string;
  cashier?: SaleCashierInfo | null;
  paymentMethod: string;
  totalAmount: Decimal | string | number;
  totalIngredientCost: Decimal | string | number;
  totalOverhead: Decimal | string | number;
  status: string;
  items: Array<{
    id: string;
    menuId: string;
    menuNameSnapshot: string;
    qty: number;
    unitPrice: Decimal | string | number;
    ingredientCostActual?: Decimal | string | number;
    overheadAllocated?: Decimal | string | number;
  }>;
  movements?: MovementWithDetails[];
}

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
    const totalRevenue = new Decimal(sale.totalAmount.toString());

    // Group movements by saleItem id (refId) if movements are present
    const movementsByItemId = new Map<string, MovementWithDetails[]>();
    if (sale.movements && Array.isArray(sale.movements)) {
      for (const mov of sale.movements) {
        if (mov.refId) {
          const list = movementsByItemId.get(mov.refId) || [];
          list.push(mov);
          movementsByItemId.set(mov.refId, list);
        }
      }
    }

    const hasMovements = sale.movements !== undefined;

    if (role === "CASHIER") {
      return {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        idempotencyKey: sale.idempotencyKey,
        soldAt: sale.soldAt,
        cashierId: sale.cashierId,
        cashier: sale.cashier
          ? { id: sale.cashier.id, name: sale.cashier.name, role: sale.cashier.role }
          : undefined,
        paymentMethod: sale.paymentMethod,
        totalAmount: totalRevenue.toFixed(2),
        status: sale.status,
        items: sale.items.map((item) => {
          const itemUnitPrice = new Decimal(item.unitPrice.toString());
          const itemSubtotal = itemUnitPrice.mul(item.qty);

          const itemMovements = movementsByItemId.get(item.id) || [];
          const cashierAllocations: BatchAllocationCashierDto[] = itemMovements.map((mov) => ({
            movementId: mov.id,
            ingredientId: mov.ingredientId,
            ingredientName: mov.ingredient?.name ?? "Bahan",
            baseUnit: mov.ingredient?.baseUnit ?? "",
            batchId: mov.batchId,
            batchExpiryDate: mov.batch?.expiryDate ?? null,
            qtyDeducted: new Decimal(mov.qtyBaseDelta.toString()).abs().toFixed(3),
          }));

          const itemDto: SaleItemCashierDto = {
            id: item.id,
            menuId: item.menuId,
            menuNameSnapshot: item.menuNameSnapshot,
            qty: item.qty,
            unitPrice: itemUnitPrice.toFixed(2),
            subtotalPrice: itemSubtotal.toFixed(2),
          };

          if (hasMovements) {
            itemDto.batchAllocations = cashierAllocations;
          }

          return itemDto;
        }),
      };
    }

    // Role is OWNER: Expose cost, margins, and full batch allocation costing
    const totalIngredientCost = new Decimal(sale.totalIngredientCost.toString());
    const totalOverhead = new Decimal(sale.totalOverhead.toString());
    const totalCost = totalIngredientCost.plus(totalOverhead);
    const grossMargin = totalRevenue.minus(totalCost);
    const marginPercentage = totalRevenue.isZero()
      ? "0.00"
      : grossMargin.div(totalRevenue).mul(100).toFixed(2);

    return {
      id: sale.id,
      invoiceNo: sale.invoiceNo,
      idempotencyKey: sale.idempotencyKey,
      soldAt: sale.soldAt,
      cashierId: sale.cashierId,
      cashier: sale.cashier
        ? { id: sale.cashier.id, name: sale.cashier.name, role: sale.cashier.role }
        : undefined,
      paymentMethod: sale.paymentMethod,
      totalAmount: totalRevenue.toFixed(2),
      totalIngredientCost: totalIngredientCost.toFixed(2),
      totalOverhead: totalOverhead.toFixed(2),
      grossMargin: grossMargin.toFixed(2),
      marginPercentage,
      status: sale.status,
      items: sale.items.map((item) => {
        const itemUnitPrice = new Decimal(item.unitPrice.toString());
        const itemSubtotal = itemUnitPrice.mul(item.qty);
        const itemIngredientCost = new Decimal(item.ingredientCostActual?.toString() ?? "0");
        const itemOverhead = new Decimal(item.overheadAllocated?.toString() ?? "0");
        const itemTotalCost = itemIngredientCost.plus(itemOverhead);
        const itemGrossMargin = itemSubtotal.minus(itemTotalCost);
        const itemMarginPct = itemSubtotal.isZero()
          ? "0.00"
          : itemGrossMargin.div(itemSubtotal).mul(100).toFixed(2);

        const itemMovements = movementsByItemId.get(item.id) || [];
        const ownerAllocations: BatchAllocationOwnerDto[] = itemMovements.map((mov) => {
          const qtyDeducted = new Decimal(mov.qtyBaseDelta.toString()).abs();
          const costPerBase = new Decimal(mov.costPerBase.toString());
          const subtotalCost = qtyDeducted.mul(costPerBase);

          return {
            movementId: mov.id,
            ingredientId: mov.ingredientId,
            ingredientName: mov.ingredient?.name ?? "Bahan",
            baseUnit: mov.ingredient?.baseUnit ?? "",
            batchId: mov.batchId,
            batchExpiryDate: mov.batch?.expiryDate ?? null,
            qtyDeducted: qtyDeducted.toFixed(3),
            costPerBase: costPerBase.toFixed(6),
            subtotalCost: subtotalCost.toFixed(2),
          };
        });

        const itemDto: SaleItemOwnerDto = {
          id: item.id,
          menuId: item.menuId,
          menuNameSnapshot: item.menuNameSnapshot,
          qty: item.qty,
          unitPrice: itemUnitPrice.toFixed(2),
          subtotalPrice: itemSubtotal.toFixed(2),
          ingredientCostActual: itemIngredientCost.toFixed(2),
          overheadAllocated: itemOverhead.toFixed(2),
          grossMargin: itemGrossMargin.toFixed(2),
          marginPercentage: itemMarginPct,
        };

        if (hasMovements) {
          itemDto.batchAllocations = ownerAllocations;
        }

        return itemDto;
      }),
    };
  }
}

export const saleService = new SaleService();
