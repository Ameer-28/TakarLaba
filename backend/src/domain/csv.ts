import { Decimal } from "decimal.js";
import { formatMoney, formatQuantity, formatPercent, safeDecimal } from "../lib/money.js";
import { todayWIBString, isExpired, isExpiringSoon } from "../lib/date.js";

/**
 * Escapes a single CSV field following RFC 4180 and protects against CSV formula injection.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }

  let str = String(val);

  // CSV Injection protection: prefix formula triggers with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If contains commas, double quotes, or newlines, quote the field and double-quote internal quotes
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Builds an RFC 4180 compliant CSV string with UTF-8 Byte Order Mark (BOM)
 * for perfect compatibility with Microsoft Excel, Google Sheets, and LibreOffice.
 */
export function buildCsv(rows: Array<Array<unknown>>): string {
  const BOM = "\uFEFF";
  const content = rows.map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
  return BOM + content;
}

export interface SaleExportItem {
  id: string;
  invoiceNo: string;
  soldAt: Date | string;
  status: "COMPLETED" | "VOIDED";
  paymentMethod: string;
  totalAmount: Decimal | string | number;
  totalIngredientCost?: Decimal | string | number;
  totalOverhead?: Decimal | string | number;
  voidReason?: string | null;
  cashier?: {
    name: string;
  } | null;
  items?: Array<{
    menuNameSnapshot: string;
    qty: number;
    unitPrice: Decimal | string | number;
  }>;
}

/**
 * Formats sales transactions into a standardized CSV string for business owners.
 */
export function formatSalesCsv(sales: SaleExportItem[]): string {
  const headers = [
    "No Transaksi",
    "Waktu Transaksi (WIB)",
    "Status",
    "Kasir",
    "Metode Bayar",
    "Total Porsi",
    "Total Penjualan (Rp)",
    "Biaya Bahan Baku (Rp)",
    "Biaya Overhead (Rp)",
    "Estimasi Laba Kotor (Rp)",
    "Rincian Menu",
    "Alasan Pembatalan",
  ];

  const rows: Array<Array<unknown>> = [headers];

  for (const s of sales) {
    const soldAtDate = s.soldAt instanceof Date ? s.soldAt : new Date(s.soldAt);
    const dateStr = todayWIBString(soldAtDate);
    const timeStr = soldAtDate.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const formattedDateTime = `${dateStr} ${timeStr}`;

    const statusLabel = s.status === "COMPLETED" ? "Selesai" : "Dibatalkan";
    const cashierName = s.cashier?.name ?? "-";

    const items = s.items ?? [];
    const totalQty = items.reduce((acc, it) => acc + (it.qty ?? 0), 0);

    const itemsSummary = items
      .map((it) => `${it.qty}x ${it.menuNameSnapshot} (@Rp${formatMoney(it.unitPrice)})`)
      .join("; ");

    const totalAmount = safeDecimal(s.totalAmount);
    const totalIngredientCost = safeDecimal(s.totalIngredientCost ?? 0);
    const totalOverhead = safeDecimal(s.totalOverhead ?? 0);
    const grossProfit = totalAmount.minus(totalIngredientCost).minus(totalOverhead);

    rows.push([
      s.invoiceNo,
      formattedDateTime,
      statusLabel,
      cashierName,
      s.paymentMethod,
      totalQty,
      formatMoney(totalAmount),
      formatMoney(totalIngredientCost),
      formatMoney(totalOverhead),
      formatMoney(grossProfit),
      itemsSummary || "-",
      s.voidReason ?? "-",
    ]);
  }

  return buildCsv(rows);
}

export interface StockExportBatch {
  id: string;
  remainingQtyBase: Decimal | string | number;
  costPerBase: Decimal | string | number;
  expiryDate: Date | string | null;
  receivedAt: Date | string;
}

export interface StockExportIngredient {
  id: string;
  name: string;
  category: string | null;
  baseUnit: string;
  yieldPercent: Decimal | string | number;
  stockBatches?: StockExportBatch[];
}

/**
 * Formats inventory stock levels into a standardized CSV string for business owners.
 */
export function formatStockCsv(
  ingredients: StockExportIngredient[],
  warnDays: number = 7,
  referenceDate: Date = new Date()
): string {
  const headers = [
    "Nama Bahan",
    "Kategori",
    "Satuan Pakai",
    "Rendemen (Yield %)",
    "Total Sisa Stok",
    "Biaya Satuan Terkini (Rp)",
    "Total Nilai Stok (Rp)",
    "Jumlah Batch Aktif",
    "Kedaluwarsa Terdekat",
    "Status Stok",
  ];

  const rows: Array<Array<unknown>> = [headers];

  for (const ing of ingredients) {
    const batches = (ing.stockBatches ?? []).filter((b) =>
      safeDecimal(b.remainingQtyBase).greaterThan(0)
    );

    let totalStock = new Decimal(0);
    let totalValue = new Decimal(0);
    let latestCost = new Decimal(0);
    let nearestExpiryDate: Date | null = null;
    let hasExpired = false;
    let hasExpiringSoon = false;

    // Sort batches by receivedAt ascending to find latest cost, and expiryDate to find nearest
    for (const b of batches) {
      const rem = safeDecimal(b.remainingQtyBase);
      const cost = safeDecimal(b.costPerBase);
      totalStock = totalStock.plus(rem);
      totalValue = totalValue.plus(rem.times(cost));

      latestCost = cost; // last processed batch will reflect latest cost

      if (b.expiryDate) {
        const expDate = b.expiryDate instanceof Date ? b.expiryDate : new Date(b.expiryDate);
        if (!nearestExpiryDate || expDate < nearestExpiryDate) {
          nearestExpiryDate = expDate;
        }

        if (isExpired(expDate, referenceDate)) {
          hasExpired = true;
        } else if (isExpiringSoon(expDate, warnDays, referenceDate)) {
          hasExpiringSoon = true;
        }
      }
    }

    let status = "Aman";
    if (totalStock.isZero()) {
      status = "Habis";
    } else if (hasExpired) {
      status = "Ada Batch Kedaluwarsa";
    } else if (hasExpiringSoon) {
      status = "Mendekati Kedaluwarsa";
    }

    const nearestExpiryStr = nearestExpiryDate
      ? todayWIBString(nearestExpiryDate)
      : "Tanpa Kedaluwarsa";

    rows.push([
      ing.name,
      ing.category ?? "Lainnya",
      ing.baseUnit,
      formatPercent(ing.yieldPercent) + "%",
      formatQuantity(totalStock),
      formatMoney(latestCost),
      formatMoney(totalValue),
      batches.length,
      nearestExpiryStr,
      status,
    ]);
  }

  return buildCsv(rows);
}
