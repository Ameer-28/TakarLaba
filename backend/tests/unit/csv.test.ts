import { describe, it, expect } from "vitest";
import {
  escapeCsvField,
  buildCsv,
  formatSalesCsv,
  formatStockCsv,
  type SaleExportItem,
  type StockExportIngredient,
} from "../../src/domain/csv.js";

describe("CSV Generator & Export Formatting (T-201 — FR-RPT-01)", () => {
  describe("escapeCsvField", () => {
    it("handles null, undefined, and empty values gracefully", () => {
      expect(escapeCsvField(null)).toBe("");
      expect(escapeCsvField(undefined)).toBe("");
      expect(escapeCsvField("")).toBe("");
    });

    it("leaves standard alphanumeric strings unquoted", () => {
      expect(escapeCsvField("INV-20261105-001")).toBe("INV-20261105-001");
      expect(escapeCsvField("Susu Segar UHT")).toBe("Susu Segar UHT");
      expect(escapeCsvField(15000)).toBe("15000");
    });

    it("quotes fields containing commas or newlines", () => {
      expect(escapeCsvField("Kopi, Susu, Gula")).toBe('"Kopi, Susu, Gula"');
      expect(escapeCsvField("Baris 1\nBaris 2")).toBe('"Baris 1\nBaris 2"');
    });

    it("escapes internal double quotes by doubling them", () => {
      expect(escapeCsvField('Roti "Enak" Spesial')).toBe('"Roti ""Enak"" Spesial"');
    });

    it("sanitizes CSV formula injection triggers (=, +, -, @)", () => {
      expect(escapeCsvField("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(escapeCsvField("+12345")).toBe("'+12345");
      expect(escapeCsvField("@admin")).toBe("'@admin");
      expect(escapeCsvField("-500")).toBe("'-500");
    });
  });

  describe("buildCsv", () => {
    it("produces RFC 4180 CRLF format preceded by UTF-8 BOM", () => {
      const rows = [
        ["Nama", "Harga"],
        ["Kopi", 15000],
      ];
      const csv = buildCsv(rows);

      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("Nama,Harga\r\nKopi,15000");
    });
  });

  describe("formatSalesCsv", () => {
    it("formats sales records into complete CSV output with items summary", () => {
      const mockSales: SaleExportItem[] = [
        {
          id: "sale-1",
          invoiceNo: "INV-20261105-ABCDEF",
          soldAt: "2026-11-05T10:30:00.000Z",
          status: "COMPLETED",
          paymentMethod: "QRIS",
          totalAmount: "36000.00",
          totalIngredientCost: "14000.00",
          totalOverhead: "2400.00",
          cashier: { name: "Dimas Barista" },
          items: [
            {
              menuNameSnapshot: "Es Kopi Susu",
              qty: 2,
              unitPrice: "18000.00",
            },
          ],
        },
        {
          id: "sale-2",
          invoiceNo: "INV-20261105-XYZ123",
          soldAt: "2026-11-05T11:00:00.000Z",
          status: "VOIDED",
          paymentMethod: "CASH",
          totalAmount: "20000.00",
          totalIngredientCost: "8000.00",
          totalOverhead: "1200.00",
          voidReason: "Salah input menu",
          cashier: { name: "Owner Toko" },
          items: [
            {
              menuNameSnapshot: "Croissant",
              qty: 1,
              unitPrice: "20000.00",
            },
          ],
        },
      ];

      const csv = formatSalesCsv(mockSales);

      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("No Transaksi,Waktu Transaksi (WIB),Status,Kasir,Metode Bayar");
      expect(csv).toContain("INV-20261105-ABCDEF");
      expect(csv).toContain("Selesai");
      expect(csv).toContain("QRIS");
      expect(csv).toContain("36000.00");
      expect(csv).toContain("14000.00"); // Biaya bahan
      expect(csv).toContain("2400.00"); // Overhead
      expect(csv).toContain("19600.00"); // Laba kotor: 36000 - 14000 - 2400
      expect(csv).toContain("2x Es Kopi Susu (@Rp18000.00)");

      // Voided row
      expect(csv).toContain("INV-20261105-XYZ123");
      expect(csv).toContain("Dibatalkan");
      expect(csv).toContain("Salah input menu");
    });
  });

  describe("formatStockCsv", () => {
    it("formats inventory ingredients and computes stock metrics and expiry status", () => {
      const refDate = new Date("2026-11-05T12:00:00.000+07:00");

      const mockIngredients: StockExportIngredient[] = [
        {
          id: "ing-1",
          name: "Susu Segar UHT",
          category: "Dairy",
          baseUnit: "ML",
          yieldPercent: 100,
          stockBatches: [
            {
              id: "b-1",
              remainingQtyBase: "2500.000",
              costPerBase: "18.00",
              expiryDate: "2026-11-07", // 2 days left -> Mendekati Kedaluwarsa
              receivedAt: "2026-11-01",
            },
          ],
        },
        {
          id: "ing-2",
          name: "Croissant Beku",
          category: "Pastry",
          baseUnit: "PCS",
          yieldPercent: 100,
          stockBatches: [
            {
              id: "b-2",
              remainingQtyBase: "10.000",
              costPerBase: "8000.00",
              expiryDate: "2026-11-01", // Expired -> Ada Batch Kedaluwarsa
              receivedAt: "2026-10-25",
            },
          ],
        },
        {
          id: "ing-3",
          name: "Gula Pasir",
          category: "Pemanis",
          baseUnit: "G",
          yieldPercent: 100,
          stockBatches: [], // Habis
        },
      ];

      const csv = formatStockCsv(mockIngredients, 7, refDate);

      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("Nama Bahan,Kategori,Satuan Pakai,Rendemen (Yield %),Total Sisa Stok");

      // Susu UHT: 2500 ML * 18 = 45000.00
      expect(csv).toContain(
        "Susu Segar UHT,Dairy,ML,100.00%,2500.000,18.00,45000.00,1,2026-11-07,Mendekati Kedaluwarsa"
      );

      // Croissant: 10 PCS * 8000 = 80000.00
      expect(csv).toContain(
        "Croissant Beku,Pastry,PCS,100.00%,10.000,8000.00,80000.00,1,2026-11-01,Ada Batch Kedaluwarsa"
      );

      // Gula: Habis
      expect(csv).toContain(
        "Gula Pasir,Pemanis,G,100.00%,0.000,0.00,0.00,0,Tanpa Kedaluwarsa,Habis"
      );
    });
  });
});
