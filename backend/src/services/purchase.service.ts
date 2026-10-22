import { Decimal } from "decimal.js";
import {
  purchaseRepository,
  type PreparedBatchRecord,
  type PurchaseFilter,
} from "../repositories/purchase.repo.js";
import { ingredientRepository } from "../repositories/ingredient.repo.js";
import { toBaseQuantity, computeCostPerBase } from "../domain/units.js";
import { todayWIB, todayWIBString } from "../lib/date.js";
import { ValidationError, NotFoundError } from "../lib/errors.js";
import type { CreatePurchaseInput } from "../validation/purchase.schema.js";

export class PurchaseService {
  constructor(
    private readonly repo = purchaseRepository,
    private readonly ingredientRepo = ingredientRepository
  ) {}

  /**
   * Processes and records a multi-row purchase atomically (FR-PUR-01).
   * Validates units against ingredient base unit or conversion units,
   * enforces expiry dates for perishable items, and computes base costs.
   */
  async createPurchase(businessId: string, createdById: string, input: CreatePurchaseInput) {
    // 1. Validate purchase date (must not exceed H+1 WIB)
    let purchasedAt = new Date();
    if (input.purchasedAt) {
      purchasedAt = new Date(input.purchasedAt);
      if (isNaN(purchasedAt.getTime())) {
        throw new ValidationError("Format tanggal pembelian tidak valid");
      }
    }

    // Tomorrow end of day WIB (H+1 WIB)
    const today = todayWIB();
    const maxAllowedDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 - 1);
    if (purchasedAt.getTime() > maxAllowedDate.getTime()) {
      throw new ValidationError("Tanggal pembelian tidak boleh melebihi H+1 dari hari ini");
    }

    // 2. Fetch and validate all ingredients involved in the purchase
    const ingredientIds = Array.from(new Set(input.items.map((it) => it.ingredientId)));
    const ingredientRecords = await Promise.all(
      ingredientIds.map(async (id) => {
        const found = await this.ingredientRepo.findById(businessId, id);
        return { id, found };
      })
    );

    const ingredientMap = new Map<
      string,
      NonNullable<(typeof ingredientRecords)[number]["found"]>
    >();

    for (const { id, found } of ingredientRecords) {
      if (!found) {
        throw new NotFoundError(`Bahan baku dengan ID "${id}" tidak ditemukan`);
      }
      if (!found.isActive) {
        throw new ValidationError(
          `Bahan baku "${found.name}" sedang berstatus nonaktif dan tidak dapat dibeli`
        );
      }
      ingredientMap.set(id, found);
    }

    // 3. Process each line item
    const preparedBatches: PreparedBatchRecord[] = [];
    let totalAmount = new Decimal(0);
    const todayStr = todayWIBString();

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i]!;
      const ingredient = ingredientMap.get(item.ingredientId)!;
      const rowNum = i + 1;

      // Unit matching: check base unit or conversion unit
      let toBaseFactor: Decimal;
      const cleanInputUnit = item.purchaseUnit.trim().toLowerCase();
      const cleanBaseUnit = ingredient.baseUnit.trim().toLowerCase();

      if (cleanInputUnit === cleanBaseUnit) {
        toBaseFactor = new Decimal(1);
      } else {
        const matchingUnit = ingredient.units.find(
          (u) => u.name.trim().toLowerCase() === cleanInputUnit
        );

        if (!matchingUnit) {
          throw new ValidationError(
            `Baris ${rowNum}: Satuan "${item.purchaseUnit}" tidak terdaftar pada bahan "${ingredient.name}". Gunakan satuan dasar (${ingredient.baseUnit.toLowerCase()}) atau tambahkan konversi satuan pada master bahan.`
          );
        }

        toBaseFactor = new Decimal(matchingUnit.toBaseFactor.toString());
      }

      // Compute base quantity and cost per base
      const purchaseQty = new Decimal(item.purchaseQty);
      const purchaseUnitPrice = new Decimal(item.purchaseUnitPrice);
      const initialQtyBase = toBaseQuantity(purchaseQty, toBaseFactor);
      const costPerBase = computeCostPerBase(purchaseUnitPrice, toBaseFactor);

      // Validate expiry date for perishable ingredients
      let expiryDate: Date | null = null;
      if (item.expiryDate) {
        const parsedExpiry = new Date(item.expiryDate);
        if (isNaN(parsedExpiry.getTime())) {
          throw new ValidationError(
            `Baris ${rowNum}: Format tanggal kedaluwarsa untuk bahan "${ingredient.name}" tidak valid`
          );
        }

        const expiryStr = todayWIBString(parsedExpiry);
        if (expiryStr < todayStr) {
          throw new ValidationError(
            `Baris ${rowNum}: Tanggal kedaluwarsa untuk bahan "${ingredient.name}" tidak boleh sebelum hari ini`
          );
        }

        expiryDate = parsedExpiry;
      } else if (ingredient.isPerishable) {
        throw new ValidationError(
          `Baris ${rowNum}: Tanggal kedaluwarsa wajib diisi untuk bahan mudah rusak "${ingredient.name}"`
        );
      }

      // Add to total amount
      const lineCost = purchaseQty.times(purchaseUnitPrice);
      totalAmount = totalAmount.plus(lineCost);

      preparedBatches.push({
        ingredientId: ingredient.id,
        expiryDate,
        purchaseQty,
        purchaseUnit: item.purchaseUnit.trim(),
        purchaseUnitPrice,
        initialQtyBase,
        costPerBase,
      });
    }

    // 4. Atomic execution
    return this.repo.createAtomic({
      businessId,
      createdById,
      supplierName: input.supplierName,
      note: input.note,
      purchasedAt,
      totalAmount,
      batches: preparedBatches,
    });
  }

  async listPurchases(businessId: string, filter?: PurchaseFilter) {
    return this.repo.findMany(businessId, filter);
  }

  async getPurchaseById(businessId: string, id: string) {
    const purchase = await this.repo.findById(businessId, id);
    if (!purchase) {
      throw new NotFoundError("Nota pembelian tidak ditemukan");
    }
    return purchase;
  }
}

export const purchaseService = new PurchaseService();
