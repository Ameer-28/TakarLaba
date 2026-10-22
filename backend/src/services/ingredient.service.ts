import { ingredientRepository, IngredientRepository } from "../repositories/ingredient.repo.js";
import { normalizeNameKey } from "../domain/units.js";
import { ConflictError, NotFoundError, ValidationError } from "../lib/errors.js";
import type {
  CreateIngredientInput,
  UpdateIngredientInput,
  QueryIngredientInput,
  PurchaseUnitInput,
} from "../validation/ingredient.schema.js";

export class IngredientService {
  constructor(private repo: IngredientRepository = ingredientRepository) {}

  async listIngredients(businessId: string, query?: QueryIngredientInput) {
    return this.repo.findMany(businessId, {
      search: query?.search,
      category: query?.category,
      isActive: query?.isActive,
    });
  }

  async getIngredientById(businessId: string, id: string) {
    const ingredient = await this.repo.findById(businessId, id);
    if (!ingredient) {
      throw new NotFoundError("Bahan baku tidak ditemukan");
    }
    return ingredient;
  }

  async createIngredient(businessId: string, input: CreateIngredientInput) {
    const nameKey = normalizeNameKey(input.name);

    // Enforce unique nameKey per business
    const existing = await this.repo.findByNameKey(businessId, nameKey);
    if (existing) {
      throw new ConflictError(
        `Bahan dengan nama "${input.name}" sudah terdaftar dalam sistem usaha Anda`
      );
    }

    // Validate duplicate purchase unit names if provided
    if (input.purchaseUnits && input.purchaseUnits.length > 0) {
      const unitNames = new Set<string>();
      for (const unit of input.purchaseUnits) {
        const lowerUnitName = unit.name.trim().toLowerCase();
        if (unitNames.has(lowerUnitName)) {
          throw new ValidationError(
            `Duplikasi nama satuan pembelian: "${unit.name}" tidak boleh diinput ganda`
          );
        }
        unitNames.add(lowerUnitName);
      }
    }

    return this.repo.create(businessId, {
      name: input.name.trim(),
      nameKey,
      category: input.category,
      baseUnit: input.baseUnit,
      yieldPercent: input.yieldPercent,
      isPerishable: input.isPerishable,
      minStockBase: input.minStockBase,
      purchaseUnits: input.purchaseUnits,
    });
  }

  async updateIngredient(businessId: string, id: string, input: UpdateIngredientInput) {
    const existing = await this.repo.findById(businessId, id);
    if (!existing) {
      throw new NotFoundError("Bahan baku tidak ditemukan");
    }

    let nameKey: string | undefined;
    if (input.name) {
      nameKey = normalizeNameKey(input.name);
      if (nameKey !== existing.nameKey) {
        const duplicate = await this.repo.findByNameKey(businessId, nameKey);
        if (duplicate && duplicate.id !== id) {
          throw new ConflictError(
            `Bahan dengan nama "${input.name}" sudah terdaftar dalam sistem usaha Anda`
          );
        }
      }
    }

    // Enforce immutability of baseUnit once used in inventory batches or recipes (FR-ING-01)
    if (input.baseUnit && input.baseUnit !== existing.baseUnit) {
      const isUsed = await this.repo.isUsedInBatchesOrRecipes(businessId, id);
      if (isUsed) {
        throw new ConflictError(
          "Satuan dasar bahan tidak dapat diubah karena telah tercatat dalam riwayat pembelian stok atau resep menu."
        );
      }
    }

    // Enforce active menu check on deactivation (FR-ING-01)
    if (input.isActive === false) {
      const activeMenus = await this.repo.findActiveMenusUsingIngredient(businessId, id);
      if (activeMenus.length > 0) {
        throw new ConflictError(
          `Bahan tidak dapat dinonaktifkan karena masih digunakan pada menu aktif: ${activeMenus.join(", ")}`
        );
      }
    }

    return this.repo.update(businessId, id, {
      name: input.name ? input.name.trim() : undefined,
      nameKey,
      category: input.category,
      baseUnit: input.baseUnit,
      yieldPercent: input.yieldPercent,
      isPerishable: input.isPerishable,
      minStockBase: input.minStockBase,
      isActive: input.isActive,
    });
  }

  async toggleActive(businessId: string, id: string, isActive: boolean) {
    const existing = await this.repo.findById(businessId, id);
    if (!existing) {
      throw new NotFoundError("Bahan baku tidak ditemukan");
    }

    // Enforce active menu check on deactivation (FR-ING-01)
    if (!isActive) {
      const activeMenus = await this.repo.findActiveMenusUsingIngredient(businessId, id);
      if (activeMenus.length > 0) {
        throw new ConflictError(
          `Bahan tidak dapat dinonaktifkan karena masih digunakan pada menu aktif: ${activeMenus.join(", ")}`
        );
      }
    }

    return this.repo.update(businessId, id, { isActive });
  }

  async addPurchaseUnit(businessId: string, ingredientId: string, input: PurchaseUnitInput) {
    const existing = await this.repo.findById(businessId, ingredientId);
    if (!existing) {
      throw new NotFoundError("Bahan baku tidak ditemukan");
    }

    const unitNameTrimmed = input.name.trim();
    const isDuplicate = existing.units.some(
      (u) => u.name.trim().toLowerCase() === unitNameTrimmed.toLowerCase()
    );

    if (isDuplicate) {
      throw new ConflictError(
        `Satuan "${unitNameTrimmed}" sudah terdaftar pada bahan ${existing.name}`
      );
    }

    return this.repo.addUnit(ingredientId, unitNameTrimmed, input.toBaseFactor);
  }

  async deletePurchaseUnit(businessId: string, ingredientId: string, unitId: string) {
    const existing = await this.repo.findById(businessId, ingredientId);
    if (!existing) {
      throw new NotFoundError("Bahan baku tidak ditemukan");
    }

    const unitExists = existing.units.some((u) => u.id === unitId);
    if (!unitExists) {
      throw new NotFoundError("Satuan pembelian tidak ditemukan pada bahan ini");
    }

    return this.repo.deleteUnit(ingredientId, unitId);
  }
}

export const ingredientService = new IngredientService();
