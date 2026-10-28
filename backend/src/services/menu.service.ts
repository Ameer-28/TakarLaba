import { menuRepository, MenuRepository, type MenuFilter } from "../repositories/menu.repo.js";
import { normalizeNameKey } from "../domain/units.js";
import { ConflictError, NotFoundError } from "../lib/errors.js";
import { Decimal } from "decimal.js";
import type { CreateMenuInput, UpdateMenuInput } from "../validation/menu.schema.js";

export class MenuService {
  constructor(private repo: MenuRepository = menuRepository) {}

  async listMenus(businessId: string, filter?: MenuFilter) {
    return this.repo.findMany(businessId, filter);
  }

  async getMenuById(businessId: string, id: string) {
    const item = await this.repo.findById(businessId, id);
    if (!item) {
      throw new NotFoundError("Menu tidak ditemukan");
    }
    return item;
  }

  async createMenu(businessId: string, input: CreateMenuInput) {
    const nameKey = normalizeNameKey(input.name);

    // Enforce unique nameKey per business
    const existing = await this.repo.findByNameKey(businessId, nameKey);
    if (existing) {
      throw new ConflictError(
        `Menu dengan nama "${input.name}" sudah terdaftar dalam sistem usaha Anda`
      );
    }

    return this.repo.create(businessId, {
      name: input.name.trim(),
      nameKey,
      category: input.category ? input.category.trim() : null,
      sellingPrice: input.sellingPrice,
      targetMargin: input.targetMargin ?? null,
      isActive: input.isActive ?? true,
    });
  }

  async updateMenu(businessId: string, id: string, input: UpdateMenuInput, userId: string) {
    const existing = await this.repo.findById(businessId, id);
    if (!existing) {
      throw new NotFoundError("Menu tidak ditemukan");
    }

    let nameKey: string | undefined;
    if (input.name) {
      nameKey = normalizeNameKey(input.name);
      if (nameKey !== existing.nameKey) {
        const duplicate = await this.repo.findByNameKey(businessId, nameKey);
        if (duplicate && duplicate.id !== id) {
          throw new ConflictError(
            `Menu dengan nama "${input.name}" sudah terdaftar dalam sistem usaha Anda`
          );
        }
      }
    }

    // Check if selling price changed
    let priceHistory:
      | {
          oldPrice: string;
          newPrice: string;
          reason: "MANUAL";
          changedById: string;
        }
      | undefined;

    if (input.sellingPrice !== undefined) {
      const oldPriceDec = new Decimal(existing.sellingPrice);
      const newPriceDec = new Decimal(input.sellingPrice);
      if (!oldPriceDec.equals(newPriceDec)) {
        priceHistory = {
          oldPrice: existing.sellingPrice,
          newPrice: newPriceDec.toFixed(2),
          reason: "MANUAL",
          changedById: userId,
        };
      }
    }

    return this.repo.update(
      businessId,
      id,
      {
        name: input.name ? input.name.trim() : undefined,
        nameKey,
        category:
          input.category !== undefined
            ? input.category
              ? input.category.trim()
              : null
            : undefined,
        sellingPrice: input.sellingPrice,
        targetMargin: input.targetMargin,
        isActive: input.isActive,
      },
      priceHistory
    );
  }

  async deleteMenu(businessId: string, id: string) {
    const existing = await this.repo.findById(businessId, id);
    if (!existing) {
      throw new NotFoundError("Menu tidak ditemukan");
    }

    const salesCount = await this.repo.countSales(businessId, id);
    if (salesCount > 0) {
      throw new ConflictError(
        "Menu sudah memiliki riwayat transaksi penjualan. Anda dapat menonaktifkannya alih-alih menghapusnya."
      );
    }

    return this.repo.delete(businessId, id);
  }

  async toggleActive(businessId: string, id: string, isActive: boolean) {
    const existing = await this.repo.findById(businessId, id);
    if (!existing) {
      throw new NotFoundError("Menu tidak ditemukan");
    }

    return this.repo.update(businessId, id, { isActive });
  }
}

export const menuService = new MenuService();
