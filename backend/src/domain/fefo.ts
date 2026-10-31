import { Decimal } from "decimal.js";
import {
  safeDecimal,
  toMoney,
  toQuantity,
  toCostPerBase,
  type DecimalValue,
} from "../lib/money.js";
import { isExpired } from "../lib/date.js";

/**
 * Representation of a stock batch available for FEFO allocation.
 * Conforms to Prisma StockBatch model fields required for inventory allocation.
 */
export interface FefoBatch {
  id: string;
  remainingQtyBase: DecimalValue;
  costPerBase: DecimalValue;
  expiryDate?: Date | string | null;
  receivedAt?: Date | string | null;
}

/**
 * Detail of an individual allocation taken from a specific batch.
 */
export interface BatchAllocation {
  batchId: string;
  allocatedQty: Decimal;
  costPerBase: Decimal;
  subtotalCost: Decimal;
  remainingQtyAfter: Decimal;
}

/**
 * Options to configure FEFO allocation behavior.
 */
export interface FefoOptions {
  /**
   * Reference date for checking batch expiration in WIB (defaults to now).
   */
  referenceDate?: Date;

  /**
   * Whether to mutate batch.remainingQtyBase in-place on input batch objects.
   * Defaults to true to support multi-item in-memory sequential checkout (ARCHITECTURE §5.1).
   */
  mutate?: boolean;

  /**
   * Whether to allow partial allocation if available stock is insufficient.
   * Defaults to false (atomic all-or-nothing: if shortage, no batches are mutated and allocations is empty).
   */
  allowPartial?: boolean;
}

/**
 * Result of the FEFO allocation calculation.
 */
export interface FefoAllocationResult {
  allocations: BatchAllocation[];
  totalAllocated: Decimal;
  totalCost: Decimal;
  requiredQty: Decimal;
  availableQty: Decimal;
  remainingNeed: Decimal;
  isShortage: boolean;
  shortageQty: Decimal;
}

/**
 * Parse a Date or date string to epoch milliseconds with Asia/Jakarta (WIB) consistency.
 */
function toTimestamp(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  if (date instanceof Date) return date.getTime();
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T00:00:00.000+07:00`).getTime();
  }
  return new Date(date).getTime();
}

/**
 * Comparator to sort batches strictly according to BR-07:
 * 1. expiryDate ASC NULLS LAST
 * 2. receivedAt ASC
 * 3. id ASC
 *
 * @param a First batch
 * @param b Second batch
 * @returns Comparison number for Array.prototype.sort
 */
export function compareBatchesFefo(a: FefoBatch, b: FefoBatch): number {
  const expiryA = toTimestamp(a.expiryDate);
  const expiryB = toTimestamp(b.expiryDate);

  // 1. expiryDate ASC NULLS LAST
  if (expiryA !== null && expiryB !== null) {
    if (expiryA !== expiryB) {
      return expiryA - expiryB;
    }
  } else if (expiryA !== null && expiryB === null) {
    return -1; // A has expiry, B is null -> A comes first
  } else if (expiryA === null && expiryB !== null) {
    return 1; // A is null, B has expiry -> B comes first
  }

  // 2. receivedAt ASC
  const receivedA = toTimestamp(a.receivedAt) ?? 0;
  const receivedB = toTimestamp(b.receivedAt) ?? 0;

  if (receivedA !== receivedB) {
    return receivedA - receivedB;
  }

  // 3. id ASC (deterministic tie-breaker)
  return a.id.localeCompare(b.id);
}

/**
 * Pure domain function to allocate stock from batches according to FEFO rules (BR-07, BR-02, BR-04).
 *
 * Rules enforced:
 * - Urutan batch: expiryDate ASC NULLS LAST, receivedAt ASC, id ASC.
 * - Batch kedaluwarsa (expiryDate < hari ini WIB) dilewati/tidak boleh dialokasikan.
 * - Batch kedaluwarsa tepat "hari ini" tetap valid hingga akhir hari WIB.
 * - Mutasi kuantitas batch dilakukan secara in-memory jika options.mutate = true.
 * - Jika stok kurang (shortage) dan allowPartial = false, tidak ada batch yang termutasi (atomik).
 *
 * @param batches Array of available stock batches
 * @param requiredQty Raw base quantity required
 * @param options Allocation configuration (referenceDate, mutate, allowPartial)
 * @returns Detailed allocation result with totals, allocations list, and shortage metrics
 */
export function allocateFefo(
  batches: FefoBatch[],
  requiredQty: DecimalValue,
  options?: FefoOptions
): FefoAllocationResult {
  const needed = toQuantity(requiredQty);
  const refDate = options?.referenceDate ?? new Date();
  const mutate = options?.mutate ?? true;
  const allowPartial = options?.allowPartial ?? false;

  // Zero or negative need guard
  if (needed.lessThanOrEqualTo(0)) {
    return {
      allocations: [],
      totalAllocated: new Decimal(0),
      totalCost: new Decimal(0),
      requiredQty: needed,
      availableQty: new Decimal(0),
      remainingNeed: new Decimal(0),
      isShortage: false,
      shortageQty: new Decimal(0),
    };
  }

  // Filter eligible batches: must have remainingQtyBase > 0 and not expired (BR-07)
  const eligibleBatches = batches.filter((b) => {
    const remaining = safeDecimal(b.remainingQtyBase);
    if (remaining.lessThanOrEqualTo(0)) {
      return false;
    }
    return !isExpired(b.expiryDate, refDate);
  });

  // Calculate total valid available stock
  let totalAvailable = new Decimal(0);
  for (const b of eligibleBatches) {
    totalAvailable = totalAvailable.plus(safeDecimal(b.remainingQtyBase));
  }
  totalAvailable = toQuantity(totalAvailable);

  const isShortage = totalAvailable.lessThan(needed);
  const shortageQty = isShortage ? toQuantity(needed.minus(totalAvailable)) : new Decimal(0);

  // If shortage and partial allocation is disallowed, return immediately without touching batches
  if (isShortage && !allowPartial) {
    return {
      allocations: [],
      totalAllocated: new Decimal(0),
      totalCost: new Decimal(0),
      requiredQty: needed,
      availableQty: totalAvailable,
      remainingNeed: shortageQty,
      isShortage: true,
      shortageQty,
    };
  }

  // Sort eligible batches by FEFO order (BR-07)
  const sortedBatches = [...eligibleBatches].sort(compareBatchesFefo);

  let remainingNeed = needed;
  let totalAllocated = new Decimal(0);
  let totalCost = new Decimal(0);
  const allocations: BatchAllocation[] = [];

  for (const batch of sortedBatches) {
    if (remainingNeed.lessThanOrEqualTo(0)) {
      break;
    }

    const currentQty = safeDecimal(batch.remainingQtyBase);
    const costPerBase = toCostPerBase(batch.costPerBase);

    let allocatedFromBatch: Decimal;
    let remainingQtyAfter: Decimal;

    if (currentQty.lessThanOrEqualTo(remainingNeed)) {
      allocatedFromBatch = currentQty;
      remainingQtyAfter = new Decimal(0);
    } else {
      allocatedFromBatch = remainingNeed;
      remainingQtyAfter = currentQty.minus(allocatedFromBatch);
    }

    allocatedFromBatch = toQuantity(allocatedFromBatch);
    remainingQtyAfter = toQuantity(remainingQtyAfter);

    const subtotalCost = toMoney(allocatedFromBatch.times(costPerBase));

    remainingNeed = toQuantity(remainingNeed.minus(allocatedFromBatch));
    totalAllocated = toQuantity(totalAllocated.plus(allocatedFromBatch));
    totalCost = toMoney(totalCost.plus(subtotalCost));

    allocations.push({
      batchId: batch.id,
      allocatedQty: allocatedFromBatch,
      costPerBase,
      subtotalCost,
      remainingQtyAfter,
    });

    if (mutate) {
      batch.remainingQtyBase = remainingQtyAfter;
    }
  }

  return {
    allocations,
    totalAllocated,
    totalCost,
    requiredQty: needed,
    availableQty: totalAvailable,
    remainingNeed: remainingNeed.greaterThan(0) ? remainingNeed : new Decimal(0),
    isShortage,
    shortageQty,
  };
}
