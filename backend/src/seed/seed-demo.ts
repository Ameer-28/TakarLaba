import { prisma } from "../lib/db.js";
import { auth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";
import { todayWIB } from "../lib/date.js";
import {
  DEMO_BUSINESS_ID,
  DEMO_BUSINESS_SETTINGS,
  DEMO_OVERHEAD_COSTS,
  DEMO_INGREDIENTS,
  DEMO_MENUS,
  DEMO_OPENING_BATCHES,
} from "./fixture-data.js";
import { generate30DaySales } from "./sales-generator.js";

export function getDemoPassword(fallback?: string): string {
  const password = process.env.DEMO_PASSWORD || fallback;
  if (!password || password.trim() === "") {
    throw new Error("DEMO_PASSWORD environment variable is required to run seed");
  }
  return password;
}

export function getDemoUsers(password: string) {
  return [
    {
      email: "owner@takarlaba.demo",
      password,
      name: "Demo Pemilik",
      role: "OWNER" as const,
    },
    {
      email: "kasir@takarlaba.demo",
      password,
      name: "Demo Kasir",
      role: "CASHIER" as const,
    },
  ];
}

export const DEMO_USERS = getDemoUsers("placeholder-password");

export async function seedV0() {
  const password = getDemoPassword("DemoPassword123!");
  const demoUsers = getDemoUsers(password);

  const business = await prisma.business.upsert({
    where: { id: DEMO_BUSINESS_ID },
    update: {
      name: "Kopi Takar Laba (Demo)",
      isDemo: true,
      targetMarginDefault: 50.0,
      expiryWarnDays: 3,
      priceRoundingStep: 500,
      expectedMonthlyPortions: 1000,
      wastePromoMinMargin: 10.0,
      timezone: "Asia/Jakarta",
    },
    create: {
      id: DEMO_BUSINESS_ID,
      name: "Kopi Takar Laba (Demo)",
      isDemo: true,
      targetMarginDefault: 50.0,
      expiryWarnDays: 3,
      priceRoundingStep: 500,
      expectedMonthlyPortions: 1000,
      wastePromoMinMargin: 10.0,
      timezone: "Asia/Jakarta",
    },
  });

  for (const demoUser of demoUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: demoUser.email },
    });

    if (existingUser) {
      if (existingUser.businessId === business.id || !existingUser.businessId) {
        await prisma.user.delete({ where: { id: existingUser.id } });
      }
    }

    const created = await auth.api.signUpEmail({
      body: {
        email: demoUser.email,
        password: demoUser.password,
        name: demoUser.name,
      },
    });

    if (!created?.user) {
      throw new Error(`Gagal membuat akun Better Auth untuk ${demoUser.email}`);
    }

    await prisma.user.update({
      where: { id: created.user.id },
      data: {
        businessId: business.id,
        role: demoUser.role,
        name: demoUser.name,
        isActive: true,
        emailVerified: true,
      },
    });
  }
}

/**
 * Cleans up all child tables for the demo business in proper topological foreign key order.
 * Strictly scoped to isDemo=true (Rule 20).
 */
export async function cleanDemoBusiness(businessId = DEMO_BUSINESS_ID, deleteUsers = false) {
  const existingBiz = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, isDemo: true },
  });

  if (existingBiz && !existingBiz.isDemo) {
    throw new Error("Security violation: Refusing to clean non-demo business");
  }

  if (!existingBiz) {
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      // 1. SaleItem
      await tx.saleItem.deleteMany({
        where: { sale: { businessId } },
      });

      // 2. Sale
      await tx.sale.deleteMany({
        where: { businessId },
      });

      // 3. StockMovement
      await tx.stockMovement.deleteMany({
        where: { businessId },
      });

      // 4. MenuPriceHistory
      await tx.menuPriceHistory.deleteMany({
        where: { menu: { businessId } },
      });

      // 5. MarginAlert
      await tx.marginAlert.deleteMany({
        where: { businessId },
      });

      // 6. RecipeItem
      await tx.recipeItem.deleteMany({
        where: { menu: { businessId } },
      });

      // 7. Menu
      await tx.menu.deleteMany({
        where: { businessId },
      });

      // 8. OverheadCost
      await tx.overheadCost.deleteMany({
        where: { businessId },
      });

      // 9. StockBatch
      await tx.stockBatch.deleteMany({
        where: { businessId },
      });

      // 10. Purchase
      await tx.purchase.deleteMany({
        where: { businessId },
      });

      // 11. IngredientUnit
      await tx.ingredientUnit.deleteMany({
        where: { ingredient: { businessId } },
      });

      // 12. Ingredient
      await tx.ingredient.deleteMany({
        where: { businessId },
      });

      // 13. Users (optional, e.g. for complete teardown)
      if (deleteUsers) {
        await tx.session.deleteMany({
          where: { user: { businessId } },
        });
        await tx.account.deleteMany({
          where: { user: { businessId } },
        });
        await tx.user.deleteMany({
          where: { businessId },
        });
      }
    },
    { maxWait: 10000, timeout: 60000 }
  );

  logger.info({ businessId }, "Data bisnis demo berhasil dibersihkan");
}

export interface SeedDemoOptions {
  businessId?: string;
  customPassword?: string;
  referenceDate?: Date;
  deleteUsers?: boolean;
}

/**
 * Deterministically seeds the full PRD Lampiran A & B fixture for the demo business.
 */
export async function seedDemo(options: SeedDemoOptions = {}) {
  const businessId = options.businessId ?? DEMO_BUSINESS_ID;
  const password = options.customPassword ?? getDemoPassword("DemoPassword123!");
  const refDate = options.referenceDate ?? todayWIB();

  logger.info({ businessId }, "Memulai eksekusi seed deterministik bisnis demo...");

  // 1. Clean existing domain data for this demo business
  await cleanDemoBusiness(businessId, options.deleteUsers ?? false);

  // 2. Upsert demo business
  const business = await prisma.business.upsert({
    where: { id: businessId },
    update: {
      name: DEMO_BUSINESS_SETTINGS.name,
      isDemo: true,
      targetMarginDefault: DEMO_BUSINESS_SETTINGS.targetMarginDefault,
      priceRoundingStep: DEMO_BUSINESS_SETTINGS.priceRoundingStep,
      expiryWarnDays: DEMO_BUSINESS_SETTINGS.expiryWarnDays,
      expectedMonthlyPortions: DEMO_BUSINESS_SETTINGS.expectedMonthlyPortions,
      wastePromoMinMargin: DEMO_BUSINESS_SETTINGS.wastePromoMinMargin,
      timezone: DEMO_BUSINESS_SETTINGS.timezone,
    },
    create: {
      id: businessId,
      name: DEMO_BUSINESS_SETTINGS.name,
      isDemo: true,
      targetMarginDefault: DEMO_BUSINESS_SETTINGS.targetMarginDefault,
      priceRoundingStep: DEMO_BUSINESS_SETTINGS.priceRoundingStep,
      expiryWarnDays: DEMO_BUSINESS_SETTINGS.expiryWarnDays,
      expectedMonthlyPortions: DEMO_BUSINESS_SETTINGS.expectedMonthlyPortions,
      wastePromoMinMargin: DEMO_BUSINESS_SETTINGS.wastePromoMinMargin,
      timezone: DEMO_BUSINESS_SETTINGS.timezone,
    },
  });

  // 3. Ensure demo users exist
  const demoUsers = getDemoUsers(password);
  let cashierUserId = "demo-cashier-id";
  let ownerUserId = "demo-owner-id";

  for (const demoUser of demoUsers) {
    let user = await prisma.user.findUnique({
      where: { email: demoUser.email },
    });

    if (!user) {
      const created = await auth.api.signUpEmail({
        body: {
          email: demoUser.email,
          password: demoUser.password,
          name: demoUser.name,
        },
      });

      if (!created?.user) {
        throw new Error(`Gagal membuat akun Better Auth untuk ${demoUser.email}`);
      }
      user = await prisma.user.findUnique({ where: { id: created.user.id } });
    }

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          businessId: business.id,
          role: demoUser.role,
          name: demoUser.name,
          isActive: true,
          emailVerified: true,
        },
      });

      if (demoUser.role === "CASHIER") {
        cashierUserId = user.id;
      } else if (demoUser.role === "OWNER") {
        ownerUserId = user.id;
      }
    }
  }

  // 4. Seed overheads, ingredients, units, menus, recipes, sales, and batches inside a single high-performance transaction
  await prisma.$transaction(
    async (tx) => {
      // 4a. Overhead costs (batch insert)
      const overheadData = DEMO_OVERHEAD_COSTS.map((ovh) => ({
        id: `${businessId}-${ovh.id}`,
        businessId: business.id,
        name: ovh.name,
        type: ovh.type,
        monthlyAmount: ovh.monthlyAmount,
        isActive: ovh.isActive,
      }));
      await tx.overheadCost.createMany({ data: overheadData });

      // 4b. Ingredients & units (batch insert)
      const ingIdMap = new Map<string, string>();
      const ingredientData = [];
      const unitData = [];

      for (const ing of DEMO_INGREDIENTS) {
        const actualIngId = `${businessId}-${ing.id}`;
        ingIdMap.set(ing.id, actualIngId);

        ingredientData.push({
          id: actualIngId,
          businessId: business.id,
          name: ing.name,
          nameKey: ing.nameKey,
          category: ing.category,
          baseUnit: ing.baseUnit,
          yieldPercent: ing.yieldPercent,
          isPerishable: ing.isPerishable,
          minStockBase: ing.minStockBase,
          isActive: true,
        });

        for (const u of ing.units) {
          unitData.push({
            ingredientId: actualIngId,
            name: u.name,
            toBaseFactor: u.toBaseFactor,
          });
        }
      }
      await tx.ingredient.createMany({ data: ingredientData });
      await tx.ingredientUnit.createMany({ data: unitData });

      // 4c. Menus & recipes (batch insert)
      // Menus are backdated 45 days so they are mature (age >= 14 days) for Menu Engineering classification (BR-10, FR-MEG-01)
      const menuCreatedAt = new Date(refDate.getTime() - 45 * 24 * 60 * 60 * 1000);
      const menuIdMap = new Map<string, string>();
      const menuData = [];
      const recipeItemData = [];

      for (const menu of DEMO_MENUS) {
        const actualMenuId = `${businessId}-${menu.id}`;
        menuIdMap.set(menu.id, actualMenuId);

        menuData.push({
          id: actualMenuId,
          businessId: business.id,
          name: menu.name,
          nameKey: menu.nameKey,
          category: menu.category,
          sellingPrice: menu.sellingPrice,
          targetMargin: menu.targetMargin,
          isActive: true,
          createdAt: menuCreatedAt,
        });

        for (const r of menu.recipes) {
          const actualIngId = ingIdMap.get(r.ingredientId);
          if (!actualIngId) {
            throw new Error(`Ingredient mapping not found for ${r.ingredientId}`);
          }
          recipeItemData.push({
            menuId: actualMenuId,
            ingredientId: actualIngId,
            qtyUsableBase: r.qtyUsableBase,
          });
        }
      }
      await tx.menu.createMany({ data: menuData });
      await tx.recipeItem.createMany({ data: recipeItemData });

      // 4d. Seed 30-day historical sales (1.300 portions) WITHOUT stock deduction
      const { sales } = generate30DaySales({
        businessId: business.id,
        cashierId: cashierUserId,
        referenceDate: refDate,
        overheadPerPortion: 1200,
      });

      interface SeedSaleRecord {
        id: string;
        businessId: string;
        invoiceNo: string;
        idempotencyKey: string;
        soldAt: Date;
        cashierId: string;
        paymentMethod: "CASH" | "QRIS" | "TRANSFER";
        totalAmount: string;
        totalIngredientCost: string;
        totalOverhead: string;
        status: "COMPLETED" | "VOIDED";
        voidedAt?: Date | null;
        voidReason?: string | null;
        voidedById?: string | null;
        createdAt: Date;
      }

      const salesData: SeedSaleRecord[] = [];
      const saleItemsData = [];

      for (const sale of sales) {
        const saleRecordId = `${businessId}-${sale.id}`;
        salesData.push({
          id: saleRecordId,
          businessId: business.id,
          invoiceNo: sale.invoiceNo,
          idempotencyKey: `${businessId}-${sale.idempotencyKey}`,
          soldAt: sale.soldAt,
          cashierId: cashierUserId,
          paymentMethod: sale.paymentMethod,
          totalAmount: sale.totalAmount,
          totalIngredientCost: sale.totalIngredientCost,
          totalOverhead: sale.totalOverhead,
          status: "COMPLETED" as const,
          createdAt: sale.createdAt,
        });

        for (const it of sale.items) {
          const actualMenuId = menuIdMap.get(it.menuId) ?? it.menuId;
          saleItemsData.push({
            id: `${businessId}-${it.id}`,
            saleId: saleRecordId,
            menuId: actualMenuId,
            menuNameSnapshot: it.menuNameSnapshot,
            qty: it.qty,
            unitPrice: it.unitPrice,
            ingredientCostActual: it.ingredientCostActual,
            overheadAllocated: it.overheadAllocated,
          });
        }
      }

      // Designate 1 historical sale as VOIDED to showcase POS void & cancellation feature
      const voidSaleIndex = Math.max(0, salesData.length - 12);
      const voidedSale = salesData[voidSaleIndex];
      if (voidedSale) {
        voidedSale.status = "VOIDED";
        voidedSale.voidedAt = new Date(voidedSale.soldAt.getTime() + 12 * 60 * 1000);
        voidedSale.voidReason = "Pelanggan salah memilih varian minuman dingin dan meminta pembatalan";
        voidedSale.voidedById = ownerUserId;
      }

      // Batch insert in chunks of 500 to keep parameter count safely below PG limits
      const CHUNK_SIZE = 500;
      for (let i = 0; i < salesData.length; i += CHUNK_SIZE) {
        await tx.sale.createMany({
          data: salesData.slice(i, i + CHUNK_SIZE),
        });
      }

      for (let i = 0; i < saleItemsData.length; i += CHUNK_SIZE) {
        await tx.saleItem.createMany({
          data: saleItemsData.slice(i, i + CHUNK_SIZE),
        });
      }

      // 4e. Seed realistic historical purchases (for Purchase History & PO inspection)
      const purchaseDate1 = new Date(refDate.getTime() - 5 * 24 * 60 * 60 * 1000);
      const purchaseDate2 = new Date(refDate.getTime() - 3 * 24 * 60 * 60 * 1000);
      const purchaseDate3 = new Date(refDate.getTime() - 1 * 24 * 60 * 60 * 1000);

      const purchaseId1 = `${businessId}-po-001`;
      const purchaseId2 = `${businessId}-po-002`;
      const purchaseId3 = `${businessId}-po-003`;

      const purchaseData = [
        {
          id: purchaseId1,
          businessId: business.id,
          supplierName: "PT Sumber Kopi Makmur",
          purchasedAt: purchaseDate1,
          note: "Pengadaan rutin biji kopi premium, susu UHT segar, dan persediaan paper cup set.",
          totalAmount: "1350000.00",
          createdById: ownerUserId,
          createdAt: purchaseDate1,
        },
        {
          id: purchaseId2,
          businessId: business.id,
          supplierName: "Toko Bahan Kue & Minuman Sejahtera",
          purchasedAt: purchaseDate2,
          note: "Restok gula aren cair organik, susu oat barista, bubuk matcha Uji, dan teh celup melati.",
          totalAmount: "840000.00",
          createdById: ownerUserId,
          createdAt: purchaseDate2,
        },
        {
          id: purchaseId3,
          businessId: business.id,
          supplierName: "Depo Bakery & Bahan Segar Jaya",
          purchasedAt: purchaseDate3,
          note: "Pengadaan bahan roti tawar kupas, mentega Anchor, meses coklat, dan croissant butter beku.",
          totalAmount: "765000.00",
          createdById: ownerUserId,
          createdAt: purchaseDate3,
        },
      ];
      await tx.purchase.createMany({ data: purchaseData });

      // 4f. Seed opening stock batches AFTER sales (opening balance)
      const batchData = [];
      for (const batch of DEMO_OPENING_BATCHES) {
        const actualIngId = ingIdMap.get(batch.ingredientId);
        if (!actualIngId) continue;

        let expiryDate: Date | null = null;
        if (batch.daysExpiryOffset !== null) {
          expiryDate = new Date(refDate);
          expiryDate.setDate(expiryDate.getDate() + batch.daysExpiryOffset);
        }

        // Link batch to historical purchase order
        let purchaseId: string | null = null;
        if (
          batch.id === "demo-batch-kopi" ||
          batch.id === "demo-batch-susu-uht-a" ||
          batch.id === "demo-batch-cup-set"
        ) {
          purchaseId = purchaseId1;
        } else if (
          batch.id === "demo-batch-gula-aren" ||
          batch.id === "demo-batch-susu-oat" ||
          batch.id === "demo-batch-bubuk-matcha" ||
          batch.id === "demo-batch-teh-celup"
        ) {
          purchaseId = purchaseId2;
        } else if (
          batch.id === "demo-batch-croissant-valid" ||
          batch.id === "demo-batch-roti-tawar" ||
          batch.id === "demo-batch-mentega" ||
          batch.id === "demo-batch-meses-coklat"
        ) {
          purchaseId = purchaseId3;
        }

        batchData.push({
          id: `${businessId}-${batch.id}`,
          businessId: business.id,
          ingredientId: actualIngId,
          purchaseId,
          receivedAt: refDate,
          expiryDate,
          purchaseQty: batch.purchaseQty,
          purchaseUnit: batch.purchaseUnit,
          purchaseUnitPrice: batch.purchaseUnitPrice,
          initialQtyBase: batch.initialQtyBase,
          remainingQtyBase: batch.remainingQtyBase,
          costPerBase: batch.costPerBase,
        });
      }
      await tx.stockBatch.createMany({ data: batchData });

      // 4g. Stock Movements: Void restoration, Waste log, and Stock Opname physical adjustments
      const movementData = [];

      if (voidedSale) {
        movementData.push({
          id: `${businessId}-mov-void-001`,
          businessId: business.id,
          ingredientId: ingIdMap.get("demo-ing-susu-uht")!,
          batchId: `${businessId}-demo-batch-susu-uht-a`,
          type: "VOID_RESTORE" as const,
          qtyBaseDelta: "200.000",
          costPerBase: "18.000000",
          refType: "SALE_VOID",
          refId: voidedSale.id,
          note: "Restorasi stok dari pembatalan transaksi POS (Void)",
          createdById: ownerUserId,
          createdAt: voidedSale.voidedAt ?? refDate,
        });
      }

      // Waste records (Catatan Buang / Food Waste)
      const wasteDate1 = new Date(refDate.getTime() - 1 * 24 * 60 * 60 * 1000);
      movementData.push({
        id: `${businessId}-mov-waste-001`,
        businessId: business.id,
        ingredientId: ingIdMap.get("demo-ing-croissant-beku")!,
        batchId: `${businessId}-demo-batch-croissant-expired`,
        type: "WASTE" as const,
        qtyBaseDelta: "-2.000",
        costPerBase: "10500.000000",
        refType: "MANUAL_WASTE",
        refId: null,
        note: "Kedaluwarsa di rak penyimpanan chiller (melewati best-before)",
        createdById: ownerUserId,
        createdAt: wasteDate1,
      });

      const wasteDate2 = new Date(refDate.getTime() - 2 * 24 * 60 * 60 * 1000);
      movementData.push({
        id: `${businessId}-mov-waste-002`,
        businessId: business.id,
        ingredientId: ingIdMap.get("demo-ing-roti-tawar")!,
        batchId: `${businessId}-demo-batch-roti-tawar`,
        type: "WASTE" as const,
        qtyBaseDelta: "-1.000",
        costPerBase: "1500.000000",
        refType: "MANUAL_WASTE",
        refId: null,
        note: "Kemasan sobek saat penerimaan barang dan tekstur roti mengering",
        createdById: ownerUserId,
        createdAt: wasteDate2,
      });

      // Stock Opname Adjustments (Penyesuaian Fisik)
      const adjDate1 = new Date(refDate.getTime() - 3 * 24 * 60 * 60 * 1000);
      movementData.push({
        id: `${businessId}-mov-adj-001`,
        businessId: business.id,
        ingredientId: ingIdMap.get("demo-ing-kopi")!,
        batchId: `${businessId}-demo-batch-kopi`,
        type: "ADJUSTMENT" as const,
        qtyBaseDelta: "-50.000",
        costPerBase: "180.000000",
        refType: "STOCK_OPNAME",
        refId: null,
        note: "Penyesuaian fisik opname mingguan - selisih bubuk tertinggal di hopper grinder",
        createdById: ownerUserId,
        createdAt: adjDate1,
      });

      const adjDate2 = new Date(refDate.getTime() - 2 * 24 * 60 * 60 * 1000);
      movementData.push({
        id: `${businessId}-mov-adj-002`,
        businessId: business.id,
        ingredientId: ingIdMap.get("demo-ing-gula-pasir")!,
        batchId: `${businessId}-demo-batch-gula-pasir`,
        type: "ADJUSTMENT" as const,
        qtyBaseDelta: "100.000",
        costPerBase: "16.000000",
        refType: "STOCK_OPNAME",
        refId: null,
        note: "Koreksi kelebihan timbangan fisik stok di toples station bar",
        createdById: ownerUserId,
        createdAt: adjDate2,
      });

      await tx.stockMovement.createMany({ data: movementData });

      // 4h. MarginAlerts: 1 OPEN alert (Roti Bakar) and 1 RESOLVED alert (Es Teh Manis)
      const alert1Id = `${businessId}-alert-001`;
      const alert2Id = `${businessId}-alert-002`;

      const alertData = [
        {
          id: alert1Id,
          businessId: business.id,
          menuId: menuIdMap.get("demo-menu-roti-bakar")!,
          status: "OPEN" as const,
          resolution: null,
          triggerPurchaseId: purchaseId3,
          triggerIngredientId: ingIdMap.get("demo-ing-mentega")!,
          ingredientCostBefore: "7000.000000",
          ingredientCostAfter: "7800.000000",
          fullCostBefore: "8200.00",
          fullCostAfter: "9000.00",
          marginBeforePct: "51.25",
          marginAfterPct: "43.75",
          targetPct: "50.00",
          sellingPriceAtTrigger: "16000.00",
          recommendedPrice: "18000.00",
          note: "Kenaikan harga beli mentega Anchor menyebabkan margin proyeksi turun di bawah target 50%. Rekomendasi: naikkan harga jual ke Rp18.000 atau kurangi takaran mentega.",
          createdAt: purchaseDate3,
          updatedAt: purchaseDate3,
        },
        {
          id: alert2Id,
          businessId: business.id,
          menuId: menuIdMap.get("demo-menu-es-teh")!,
          status: "RESOLVED" as const,
          resolution: "PRICE_RAISED" as const,
          triggerPurchaseId: purchaseId2,
          triggerIngredientId: ingIdMap.get("demo-ing-teh-celup")!,
          ingredientCostBefore: "1800.000000",
          ingredientCostAfter: "2200.000000",
          fullCostBefore: "3000.00",
          fullCostAfter: "3400.00",
          marginBeforePct: "50.00",
          marginAfterPct: "43.33",
          targetPct: "50.00",
          sellingPriceAtTrigger: "6000.00",
          recommendedPrice: "7000.00",
          resolvedAt: purchaseDate2,
          resolvedById: ownerUserId,
          note: "Harga jual berhasil dinaikkan dari Rp6.000 menjadi Rp7.000 untuk mempertahankan margin 50%.",
          createdAt: purchaseDate2,
          updatedAt: purchaseDate2,
        },
      ];
      await tx.marginAlert.createMany({ data: alertData });

      // MenuPriceHistory for the resolved alert
      await tx.menuPriceHistory.createMany({
        data: [
          {
            id: `${businessId}-mph-001`,
            menuId: menuIdMap.get("demo-menu-es-teh")!,
            oldPrice: "6000.00",
            newPrice: "7000.00",
            reason: "PRICE_SHOCK_ALERT" as const,
            alertId: alert2Id,
            changedById: ownerUserId,
            changedAt: purchaseDate2,
          },
        ],
      });
    },
    { maxWait: 10000, timeout: 60000 }
  );

  logger.info(
    { businessId },
    "Seed demo deterministik selesai: Bisnis, Overhead, Bahan, Resep, Riwayat 1.300 Porsi, Pembelian, Stok Awal, Catatan Buang, Penyesuaian Fisik, Alert Margin, dan Riwayat Harga siap."
  );
}
