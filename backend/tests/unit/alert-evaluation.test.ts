import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "decimal.js";
import { AlertService } from "../../src/services/alert.service.js";
import type { AlertRepository } from "../../src/repositories/alert.repo.js";
import type { MenuRepository } from "../../src/repositories/menu.repo.js";
import type { SettingsRepository } from "../../src/repositories/settings.repo.js";
import type { OverheadRepository } from "../../src/repositories/overhead.repo.js";

type MockAlertRepo = {
  [K in keyof AlertRepository]: ReturnType<typeof vi.fn>;
};

type MockMenuRepo = {
  [K in keyof MenuRepository]: ReturnType<typeof vi.fn>;
};

type MockSettingsRepo = {
  [K in keyof SettingsRepository]: ReturnType<typeof vi.fn>;
};

type MockOverheadRepo = {
  [K in keyof OverheadRepository]: ReturnType<typeof vi.fn>;
};

describe("AlertService Unit & Evaluation Logic (T-051 — BR-05, BR-06, Fixture A)", () => {
  let mockRepo: MockAlertRepo;
  let mockMenuRepo: MockMenuRepo;
  let mockSettingsRepo: MockSettingsRepo;
  let mockOverheadRepo: MockOverheadRepo;
  let alertService: AlertService;

  const mockBusinessId = "biz-fixture-a";

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepo = {
      findActiveByMenuId: vi.fn(),
      findActiveAlerts: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      resolve: vi.fn(),
      acknowledge: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      countOpen: vi.fn(),
    };

    mockMenuRepo = {
      findById: vi.fn(),
      findByNameKey: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      countSales: vi.fn(),
      getLatestCostPerBaseMap: vi.fn(),
      saveRecipe: vi.fn(),
      findActiveMenusUsingIngredient: vi.fn(),
      findAllActiveMenuIds: vi.fn(),
    };

    mockSettingsRepo = {
      findById: vi.fn().mockResolvedValue({
        id: mockBusinessId,
        targetMarginDefault: new Decimal("50.00"),
        priceRoundingStep: 500,
        expectedMonthlyPortions: 1000,
      }),
      update: vi.fn(),
    };

    mockOverheadRepo = {
      sumActiveMonthlyOverhead: vi.fn().mockResolvedValue(new Decimal("1200000.00")),
      findMany: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    alertService = new AlertService(
      mockRepo as unknown as AlertRepository,
      mockMenuRepo as unknown as MenuRepository,
      mockSettingsRepo as unknown as SettingsRepository,
      mockOverheadRepo as unknown as OverheadRepository
    );
  });

  it("calculates active overhead per portion correctly (BR-04: 1.200.000 / 1.000 = 1.200)", async () => {
    const overheadPerPortion = await alertService.getOverheadPerPortion(mockBusinessId);
    expect(overheadPerPortion.toNumber()).toBe(1200);
  });

  it("evaluates price shock after purchase on Fixture A (Susu UHT Rp18 -> Rp24/ml triggers alert)", async () => {
    const previousCostMap = new Map<string, Decimal>([["ing-susu", new Decimal("18")]]);

    const purchasedBatches = [
      {
        ingredientId: "ing-susu",
        costPerBase: new Decimal("24"),
      },
    ];

    mockMenuRepo.findActiveMenusUsingIngredient.mockResolvedValueOnce([
      {
        id: "menu-kopi-aren",
        name: "Es Kopi Susu Aren",
        sellingPrice: new Decimal("18000"),
        targetMargin: new Decimal("50"),
        isActive: true,
        recipeItems: [
          {
            id: "rec-kopi",
            ingredientId: "ing-kopi",
            qtyUsableBase: new Decimal("18"),
            ingredient: {
              id: "ing-kopi",
              name: "Biji Kopi",
              baseUnit: "G",
              yieldPercent: new Decimal("100"),
              units: [],
            },
          },
          {
            id: "rec-susu",
            ingredientId: "ing-susu",
            qtyUsableBase: new Decimal("150"),
            ingredient: {
              id: "ing-susu",
              name: "Susu UHT",
              baseUnit: "ML",
              yieldPercent: new Decimal("100"),
              units: [],
            },
          },
          {
            id: "rec-aren",
            ingredientId: "ing-aren",
            qtyUsableBase: new Decimal("20"),
            ingredient: {
              id: "ing-aren",
              name: "Gula Aren Cair",
              baseUnit: "ML",
              yieldPercent: new Decimal("100"),
              units: [],
            },
          },
        ],
      },
    ]);

    mockMenuRepo.getLatestCostPerBaseMap.mockResolvedValueOnce(
      new Map([
        ["ing-kopi", new Decimal("250")],
        ["ing-susu", new Decimal("24")],
        ["ing-aren", new Decimal("27")],
      ])
    );

    mockRepo.findActiveByMenuId.mockResolvedValueOnce(null); // No existing alert
    mockRepo.create.mockImplementationOnce((data: Record<string, unknown>) =>
      Promise.resolve({ id: "alert-fixture-a", ...data, status: "OPEN" as const })
    );

    const result = await alertService.evaluatePurchaseAlerts(
      mockBusinessId,
      "pur-new",
      purchasedBatches,
      previousCostMap
    );

    expect(result).toHaveLength(1);
    const alert = result[0];
    expect(alert).toBeDefined();
    expect(alert?.menuName).toBe("Es Kopi Susu Aren");
    expect(alert?.triggerIngredientName).toBe("Susu UHT");

    // Check Before Costs
    expect(alert?.costBefore.hppBahan).toBe("7740.00");
    expect(alert?.costBefore.hppPenuh).toBe("8940.00");
    expect(alert?.costBefore.marginPercent).toBe("50.33");

    // Check After Costs
    expect(alert?.costAfter.hppBahan).toBe("8640.00");
    expect(alert?.costAfter.hppPenuh).toBe("9840.00");
    expect(alert?.costAfter.marginPercent).toBe("45.33");

    // Check Option A (Naikkan harga ke Rp20.000)
    expect(alert?.optionA.recommendedPrice).toBe("20000.00");
    expect(alert?.optionA.priceIncrease).toBe("2000.00");

    // Check Option B (Kurangi takaran Susu UHT menjadi 115 ml)
    expect(alert?.optionB.costSavingNeeded).toBe("840.00");
    expect(alert?.optionB.reducedAmount).toBe("35.000");
    expect(alert?.optionB.newTakaran).toBe("115.000");
    expect(alert?.optionB.isFeasible).toBe(true);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: mockBusinessId,
        menuId: "menu-kopi-aren",
        triggerPurchaseId: "pur-new",
        triggerIngredientId: "ing-susu",
      })
    );
  });

  it("updates existing alert instead of creating duplicate (D-06: at most one active alert per menu)", async () => {
    const previousCostMap = new Map<string, Decimal>([["ing-susu", new Decimal("24")]]);

    const purchasedBatches = [
      {
        ingredientId: "ing-susu",
        costPerBase: new Decimal("26"),
      },
    ];

    mockMenuRepo.findActiveMenusUsingIngredient.mockResolvedValueOnce([
      {
        id: "menu-kopi-aren",
        name: "Es Kopi Susu Aren",
        sellingPrice: new Decimal("18000"),
        targetMargin: new Decimal("50"),
        isActive: true,
        recipeItems: [
          {
            id: "rec-kopi",
            ingredientId: "ing-kopi",
            qtyUsableBase: new Decimal("18"),
            ingredient: {
              id: "ing-kopi",
              name: "Biji Kopi",
              baseUnit: "G",
              yieldPercent: new Decimal("100"),
              units: [],
            },
          },
          {
            id: "rec-susu",
            ingredientId: "ing-susu",
            qtyUsableBase: new Decimal("150"),
            ingredient: {
              id: "ing-susu",
              name: "Susu UHT",
              baseUnit: "ML",
              yieldPercent: new Decimal("100"),
              units: [],
            },
          },
          {
            id: "rec-aren",
            ingredientId: "ing-aren",
            qtyUsableBase: new Decimal("20"),
            ingredient: {
              id: "ing-aren",
              name: "Gula Aren Cair",
              baseUnit: "ML",
              yieldPercent: new Decimal("100"),
              units: [],
            },
          },
        ],
      },
    ]);

    mockMenuRepo.getLatestCostPerBaseMap.mockResolvedValueOnce(
      new Map([
        ["ing-kopi", new Decimal("250")],
        ["ing-susu", new Decimal("26")],
        ["ing-aren", new Decimal("27")],
      ])
    );

    mockRepo.findActiveByMenuId.mockResolvedValueOnce({
      id: "existing-alert-1",
      status: "OPEN",
    });

    mockRepo.update.mockResolvedValueOnce({
      id: "existing-alert-1",
      status: "OPEN",
    });

    const result = await alertService.evaluatePurchaseAlerts(
      mockBusinessId,
      "pur-2",
      purchasedBatches,
      previousCostMap
    );

    expect(result).toHaveLength(1);
    expect(mockRepo.update).toHaveBeenCalledWith("existing-alert-1", expect.any(Object));
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("auto-resolves open alert when cheaper ingredient price restores margin >= target (BR-05)", async () => {
    const previousCostMap = new Map<string, Decimal>([["ing-susu", new Decimal("24")]]);

    // Cheaper purchase brings cost down to Rp16/ml
    const purchasedBatches = [
      {
        ingredientId: "ing-susu",
        costPerBase: new Decimal("16"),
      },
    ];

    mockMenuRepo.findActiveMenusUsingIngredient.mockResolvedValueOnce([
      {
        id: "menu-kopi-aren",
        name: "Es Kopi Susu Aren",
        sellingPrice: new Decimal("18000"),
        targetMargin: new Decimal("50"),
        isActive: true,
        recipeItems: [
          {
            id: "rec-susu",
            ingredientId: "ing-susu",
            qtyUsableBase: new Decimal("150"),
            ingredient: {
              id: "ing-susu",
              name: "Susu UHT",
              baseUnit: "ML",
              yieldPercent: new Decimal("100"),
              units: [],
            },
          },
        ],
      },
    ]);

    mockMenuRepo.getLatestCostPerBaseMap.mockResolvedValueOnce(
      new Map([["ing-susu", new Decimal("16")]])
    );

    mockRepo.findActiveByMenuId.mockResolvedValueOnce({
      id: "existing-alert-1",
      status: "OPEN",
    });

    const result = await alertService.evaluatePurchaseAlerts(
      mockBusinessId,
      "pur-cheap",
      purchasedBatches,
      previousCostMap
    );

    // No new or updated active alert in return
    expect(result).toHaveLength(0);

    // Alert auto-resolved
    expect(mockRepo.resolve).toHaveBeenCalledWith(
      "existing-alert-1",
      "AUTO_RESOLVED",
      null,
      expect.stringContaining("Margin pulih secara otomatis")
    );
  });
});
