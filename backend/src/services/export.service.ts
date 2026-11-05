import { saleRepository, SaleRepository } from "../repositories/sale.repo.js";
import { inventoryRepository, InventoryRepository } from "../repositories/inventory.repo.js";
import { settingsRepository, SettingsRepository } from "../repositories/settings.repo.js";
import { formatSalesCsv, formatStockCsv, type SaleExportItem } from "../domain/csv.js";
import { startOfDayWIB, endOfDayWIB, todayWIB } from "../lib/date.js";
import type { ExportSalesQuery } from "../validation/export.schema.js";

export class ExportService {
  constructor(
    private readonly saleRepo: SaleRepository = saleRepository,
    private readonly inventoryRepo: InventoryRepository = inventoryRepository,
    private readonly settingsRepo: SettingsRepository = settingsRepository
  ) {}

  /**
   * Generates CSV string for sales transactions filtered by date range and status (FR-RPT-01).
   */
  async exportSalesCsv(businessId: string, query?: ExportSalesQuery): Promise<string> {
    const startDate = query?.startDate ? startOfDayWIB(query.startDate) : undefined;
    const endDate = query?.endDate ? endOfDayWIB(query.endDate) : undefined;
    const status = query?.status === "ALL" ? undefined : query?.status;

    const { sales } = await this.saleRepo.findMany(businessId, {
      startDate,
      endDate,
      status,
      take: 10000, // Export up to 10k recent records
    });

    const exportItems: SaleExportItem[] = sales.map((s) => ({
      id: s.id,
      invoiceNo: s.invoiceNo,
      soldAt: s.soldAt,
      status: s.status,
      paymentMethod: s.paymentMethod,
      totalAmount: s.totalAmount.toString(),
      totalIngredientCost: s.totalIngredientCost.toString(),
      totalOverhead: s.totalOverhead.toString(),
      voidReason: s.voidReason,
      cashier: s.cashier ? { name: s.cashier.name } : null,
      items: s.items.map((it) => ({
        menuNameSnapshot: it.menuNameSnapshot,
        qty: it.qty,
        unitPrice: it.unitPrice.toString(),
      })),
    }));

    return formatSalesCsv(exportItems);
  }

  /**
   * Generates CSV string for current inventory stock valuation and batch statuses (FR-RPT-01).
   */
  async exportStockCsv(businessId: string): Promise<string> {
    const [business, ingredients] = await Promise.all([
      this.settingsRepo.findById(businessId),
      this.inventoryRepo.findIngredientsWithBatches(businessId),
    ]);

    const warnDays = business?.expiryWarnDays ?? 7;
    const referenceDate = todayWIB();

    const exportIngredients = ingredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      category: ing.category,
      baseUnit: ing.baseUnit,
      yieldPercent: ing.yieldPercent.toString(),
      stockBatches: ing.stockBatches.map((b) => ({
        id: b.id,
        remainingQtyBase: b.remainingQtyBase.toString(),
        costPerBase: b.costPerBase.toString(),
        expiryDate: b.expiryDate,
        receivedAt: b.receivedAt,
      })),
    }));

    return formatStockCsv(exportIngredients, warnDays, referenceDate);
  }
}

export const exportService = new ExportService();
