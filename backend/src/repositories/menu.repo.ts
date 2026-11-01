import { Decimal } from "decimal.js";
import { MenuReadRepository, type MenuFilter, type MenuListItem } from "./menu-read.repo.js";
import {
  MenuWriteRepository,
  type CreateMenuData,
  type UpdateMenuData,
  type PriceHistoryRecordData,
} from "./menu-write.repo.js";
import { MenuCostRepository } from "./menu-cost.repo.js";

export type { CreateMenuData, UpdateMenuData, PriceHistoryRecordData, MenuFilter, MenuListItem };

export class MenuRepository {
  private readonly readRepo: MenuReadRepository;
  private readonly writeRepo: MenuWriteRepository;
  private readonly costRepo: MenuCostRepository;

  constructor(
    readRepo: MenuReadRepository = new MenuReadRepository(),
    writeRepo: MenuWriteRepository = new MenuWriteRepository(),
    costRepo: MenuCostRepository = new MenuCostRepository()
  ) {
    this.readRepo = readRepo;
    this.writeRepo = writeRepo;
    this.costRepo = costRepo;
  }

  // --- Read Methods ---

  async findMany(businessId: string, filter?: MenuFilter): Promise<MenuListItem[]> {
    return this.readRepo.findMany(businessId, filter);
  }

  async findById(businessId: string, id: string) {
    return this.readRepo.findById(businessId, id);
  }

  async findByNameKey(businessId: string, nameKey: string) {
    return this.readRepo.findByNameKey(businessId, nameKey);
  }

  async countSales(businessId: string, id: string): Promise<number> {
    return this.readRepo.countSales(businessId, id);
  }

  async findActiveMenusUsingIngredient(businessId: string, ingredientId: string) {
    return this.readRepo.findActiveMenusUsingIngredient(businessId, ingredientId);
  }

  async findAllActiveMenuIds(businessId: string): Promise<string[]> {
    return this.readRepo.findAllActiveMenuIds(businessId);
  }

  async findPosMenus(businessId: string) {
    return this.readRepo.findPosMenus(businessId);
  }

  // --- Write Methods ---

  async create(businessId: string, data: CreateMenuData) {
    return this.writeRepo.create(businessId, data);
  }

  async update(
    businessId: string,
    id: string,
    data: UpdateMenuData,
    priceHistory?: PriceHistoryRecordData
  ) {
    return this.writeRepo.update(businessId, id, data, priceHistory);
  }

  async delete(businessId: string, id: string) {
    return this.writeRepo.delete(businessId, id);
  }

  async saveRecipe(
    businessId: string,
    menuId: string,
    items: Array<{ ingredientId: string; qtyUsableBase: Decimal | string | number }>
  ) {
    return this.writeRepo.saveRecipe(businessId, menuId, items);
  }

  // --- Cost & Batch Methods ---

  async getLatestCostPerBaseMap(
    businessId: string,
    ingredientIds: string[]
  ): Promise<Map<string, Decimal>> {
    return this.costRepo.getLatestCostPerBaseMap(businessId, ingredientIds);
  }

  async getValidStockBatches(businessId: string) {
    return this.costRepo.getValidStockBatches(businessId);
  }
}

export const menuRepository = new MenuRepository();
