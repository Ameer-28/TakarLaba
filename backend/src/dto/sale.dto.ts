import { Decimal } from "decimal.js";

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

export interface SaleItemEntity {
  id: string;
  menuId: string;
  menuNameSnapshot: string;
  qty: number;
  unitPrice: Decimal | string | number;
  ingredientCostActual?: Decimal | string | number | null;
  overheadAllocated?: Decimal | string | number | null;
}

export interface SaleEntityWithItems {
  id: string;
  invoiceNo: string;
  idempotencyKey: string;
  soldAt: Date;
  cashierId: string;
  cashier?: {
    id: string;
    name: string;
    role: string | null;
  } | null;
  paymentMethod: string;
  totalAmount: Decimal | string | number;
  totalIngredientCost: Decimal | string | number;
  totalOverhead: Decimal | string | number;
  status: string;
  items: SaleItemEntity[];
  movements?: MovementWithDetails[];
}

export function groupMovementsByItemId(
  movements?: MovementWithDetails[]
): Map<string, MovementWithDetails[]> {
  const movementsByItemId = new Map<string, MovementWithDetails[]>();
  if (movements && Array.isArray(movements)) {
    for (const mov of movements) {
      if (mov.refId) {
        const list = movementsByItemId.get(mov.refId) || [];
        list.push(mov);
        movementsByItemId.set(mov.refId, list);
      }
    }
  }
  return movementsByItemId;
}

export function mapCashierItem(
  item: SaleItemEntity,
  itemMovements: MovementWithDetails[],
  hasMovements: boolean
): SaleItemCashierDto {
  const itemUnitPrice = new Decimal(item.unitPrice.toString());
  const itemSubtotal = itemUnitPrice.mul(item.qty);

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
}

export function mapOwnerItem(
  item: SaleItemEntity,
  itemMovements: MovementWithDetails[],
  hasMovements: boolean
): SaleItemOwnerDto {
  const itemUnitPrice = new Decimal(item.unitPrice.toString());
  const itemSubtotal = itemUnitPrice.mul(item.qty);
  const itemIngredientCost = new Decimal(item.ingredientCostActual?.toString() ?? "0");
  const itemOverhead = new Decimal(item.overheadAllocated?.toString() ?? "0");
  const itemTotalCost = itemIngredientCost.plus(itemOverhead);
  const itemGrossMargin = itemSubtotal.minus(itemTotalCost);
  const itemMarginPct = itemSubtotal.isZero()
    ? "0.00"
    : itemGrossMargin.div(itemSubtotal).mul(100).toFixed(2);

  const ownerAllocations: BatchAllocationOwnerDto[] = itemMovements.map((mov) => {
    const qtyDeducted = new Decimal(mov.qtyBaseDelta.toString()).abs();
    const costPerBase = new Decimal(mov.costPerBase.toString());
    return {
      movementId: mov.id,
      ingredientId: mov.ingredientId,
      ingredientName: mov.ingredient?.name ?? "Bahan",
      baseUnit: mov.ingredient?.baseUnit ?? "",
      batchId: mov.batchId,
      batchExpiryDate: mov.batch?.expiryDate ?? null,
      qtyDeducted: qtyDeducted.toFixed(3),
      costPerBase: costPerBase.toFixed(6),
      subtotalCost: qtyDeducted.mul(costPerBase).toFixed(2),
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
}

export function mapCashierDto(
  sale: SaleEntityWithItems,
  totalRevenue: Decimal,
  movementsByItemId: Map<string, MovementWithDetails[]>
): SaleCashierResponseDto {
  const hasMovements = sale.movements !== undefined;
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
    items: sale.items.map((item) =>
      mapCashierItem(item, movementsByItemId.get(item.id) || [], hasMovements)
    ),
  };
}

export function mapOwnerDto(
  sale: SaleEntityWithItems,
  totalRevenue: Decimal,
  movementsByItemId: Map<string, MovementWithDetails[]>
): SaleOwnerResponseDto {
  const hasMovements = sale.movements !== undefined;
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
    items: sale.items.map((item) =>
      mapOwnerItem(item, movementsByItemId.get(item.id) || [], hasMovements)
    ),
  };
}

export function mapSaleToDto(
  sale: SaleEntityWithItems,
  role: "OWNER" | "CASHIER"
): SaleResponseDto {
  const totalRevenue = new Decimal(sale.totalAmount.toString());
  const movementsByItemId = groupMovementsByItemId(sale.movements);

  return role === "CASHIER"
    ? mapCashierDto(sale, totalRevenue, movementsByItemId)
    : mapOwnerDto(sale, totalRevenue, movementsByItemId);
}
