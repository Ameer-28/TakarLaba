import { Router } from "express";
import { exportService } from "../services/export.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { exportSalesQuerySchema, type ExportSalesQuery } from "../validation/export.schema.js";
import { todayWIBString } from "../lib/date.js";

export const exportRouter = Router();

// GET /api/export/sales.csv - Ekspor CSV transaksi penjualan (OWNER only, FR-RPT-01)
exportRouter.get(
  "/export/sales.csv",
  requireAuth,
  requireRole(["OWNER"]),
  validate(exportSalesQuerySchema, "query"),
  async (req, res) => {
    const ctx = requireCtx(req);
    const valid = req.valid as ExportSalesQuery;
    const csv = await exportService.exportSalesCsv(ctx.businessId, valid);
    const filename = `penjualan-${todayWIBString()}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  }
);

// GET /api/export/stock.csv - Ekspor CSV stok bahan & valuasi (OWNER only, FR-RPT-01)
exportRouter.get("/export/stock.csv", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const csv = await exportService.exportStockCsv(ctx.businessId);
  const filename = `stok-bahan-${todayWIBString()}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csv);
});
