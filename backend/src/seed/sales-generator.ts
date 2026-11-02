import { Decimal } from "decimal.js";
import { todayWIB } from "../lib/date.js";
import { DEMO_MENUS, DEMO_BUSINESS_ID } from "./fixture-data.js";

export function createPrng(seed = 0x5eed1300) {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GeneratedSaleItem {
  id: string;
  saleId: string;
  menuId: string;
  menuNameSnapshot: string;
  qty: number;
  unitPrice: string;
  ingredientCostActual: string;
  overheadAllocated: string;
}

export interface GeneratedSale {
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
  status: "COMPLETED";
  createdAt: Date;
  items: GeneratedSaleItem[];
}

export function generate30DaySales(
  options: {
    businessId?: string;
    cashierId?: string;
    referenceDate?: Date;
    seed?: number;
    overheadPerPortion?: number;
  } = {}
): { sales: GeneratedSale[]; totalPortions: number; menuPortions: Record<string, number> } {
  const businessId = options.businessId ?? DEMO_BUSINESS_ID;
  const cashierId = options.cashierId ?? "demo-cashier-id";
  const refDate = options.referenceDate ?? todayWIB();
  const prng = createPrng(options.seed ?? 0x5eed1300);
  const overheadPerPortion = options.overheadPerPortion ?? 1200;

  // Remaining portions per menu target
  const portionsRemaining: Record<string, number> = {};
  for (const m of DEMO_MENUS) {
    portionsRemaining[m.id] = m.targetPortions;
  }

  // Calculate day weights (weekdays 1.0, weekends 1.6) for past 30 days (day -29 to day 0)
  const days: { date: Date; weight: number; isWeekend: boolean }[] = [];
  const refTime = refDate.getTime();

  for (let offset = 29; offset >= 0; offset--) {
    const dayDate = new Date(refTime - offset * 24 * 60 * 60 * 1000);
    // Day of week in WIB (UTC+7)
    const dayOfWeek = (dayDate.getUTCDay() + 1) % 7; // approximate day of week
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weight = isWeekend ? 1.6 : 1.0;
    days.push({ date: dayDate, weight, isWeekend });
  }

  const totalWeight = days.reduce((sum, d) => sum + d.weight, 0);
  const totalTargetPortions = 1300;

  // Compute integer quota per day summing exactly to 1300
  const dailyQuotas = days.map((d) => {
    const raw = (totalTargetPortions * d.weight) / totalWeight;
    return {
      quota: Math.floor(raw),
      fraction: raw - Math.floor(raw),
    };
  });

  const distributed = dailyQuotas.reduce((acc, q) => acc + q.quota, 0);
  const remainder = totalTargetPortions - distributed;

  // Distribute remainder to days with largest fractions
  const sortedIndices = dailyQuotas
    .map((q, idx) => ({ idx, fraction: q.fraction }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remainder; i++) {
    const targetIdx = sortedIndices[i % sortedIndices.length]?.idx;
    if (targetIdx !== undefined) {
      dailyQuotas[targetIdx]!.quota += 1;
    }
  }

  const sales: GeneratedSale[] = [];
  let saleSeq = 1;
  let itemSeq = 1;

  const menuPortionCounts: Record<string, number> = {};
  for (const m of DEMO_MENUS) {
    menuPortionCounts[m.id] = 0;
  }

  for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
    const day = days[dayIdx]!;
    let dayRemaining = dailyQuotas[dayIdx]!.quota;
    const isLastDay = dayIdx === days.length - 1;

    // On last day, ensure all remaining menu portions are consumed
    const shouldContinue = () => {
      const remainingTotal = Object.values(portionsRemaining).reduce((a, b) => a + b, 0);
      if (isLastDay) return remainingTotal > 0;
      return dayRemaining > 0 && remainingTotal > 0;
    };

    while (shouldContinue()) {
      // Pick 1 to 3 items for basket
      const itemChoicesCount = prng() < 0.5 ? 1 : prng() < 0.85 ? 2 : 3;
      const basketItems: { menu: (typeof DEMO_MENUS)[number]; qty: number }[] = [];
      const chosenMenuIds = new Set<string>();

      for (let i = 0; i < itemChoicesCount; i++) {
        const availableMenus = DEMO_MENUS.filter(
          (m) => (portionsRemaining[m.id] ?? 0) > 0 && !chosenMenuIds.has(m.id)
        );
        if (availableMenus.length === 0) break;

        // Weighted random selection by remaining portions
        const poolSum = availableMenus.reduce((sum, m) => sum + portionsRemaining[m.id]!, 0);
        let roll = prng() * poolSum;
        let selectedMenu = availableMenus[0]!;

        for (const m of availableMenus) {
          roll -= portionsRemaining[m.id]!;
          if (roll <= 0) {
            selectedMenu = m;
            break;
          }
        }

        const remainingForMenu = portionsRemaining[selectedMenu.id]!;
        // Pick qty 1 or 2 (at most remainingForMenu)
        let qty = 1;
        if (remainingForMenu >= 2 && (isLastDay || dayRemaining >= 2) && prng() < 0.3) {
          qty = 2;
        }

        portionsRemaining[selectedMenu.id] = remainingForMenu - qty;
        menuPortionCounts[selectedMenu.id] = (menuPortionCounts[selectedMenu.id] ?? 0) + qty;
        dayRemaining -= qty;
        chosenMenuIds.add(selectedMenu.id);
        basketItems.push({ menu: selectedMenu, qty });
      }

      if (basketItems.length === 0) break;

      // Realistic sale timestamp: daytime 08:00 to 21:00 WIB
      const hour = 8 + Math.floor(prng() * 13); // 8 to 20
      const minute = Math.floor(prng() * 60);
      const second = Math.floor(prng() * 60);

      const soldAt = new Date(day.date);
      soldAt.setUTCHours(hour - 7, minute, second, 0); // Convert WIB (UTC+7) to UTC Date

      // Payment method: 50% QRIS, 35% CASH, 15% TRANSFER
      const payRoll = prng();
      const paymentMethod: "CASH" | "QRIS" | "TRANSFER" =
        payRoll < 0.5 ? "QRIS" : payRoll < 0.85 ? "CASH" : "TRANSFER";

      const saleId = `demo-sale-${String(saleSeq).padStart(4, "0")}`;
      const yyyy = soldAt.getUTCFullYear();
      const mm = String(soldAt.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(soldAt.getUTCDate()).padStart(2, "0");
      const invoiceNo = `INV-${yyyy}${mm}${dd}-${String(saleSeq).padStart(4, "0")}`;
      const idempotencyKey = `demo-seed-sale-${saleSeq}`;

      let totalAmountDec = new Decimal(0);
      let totalIngCostDec = new Decimal(0);
      let totalOverheadDec = new Decimal(0);

      const saleItems: GeneratedSaleItem[] = [];

      for (const item of basketItems) {
        const itemId = `demo-sale-item-${String(itemSeq++).padStart(5, "0")}`;
        const unitPriceDec = new Decimal(item.menu.sellingPrice);
        const itemAmount = unitPriceDec.times(item.qty);
        const itemIngCost = new Decimal(item.menu.ingredientCostExpected).times(item.qty);
        const itemOverhead = new Decimal(overheadPerPortion).times(item.qty);

        totalAmountDec = totalAmountDec.plus(itemAmount);
        totalIngCostDec = totalIngCostDec.plus(itemIngCost);
        totalOverheadDec = totalOverheadDec.plus(itemOverhead);

        saleItems.push({
          id: itemId,
          saleId,
          menuId: item.menu.id,
          menuNameSnapshot: item.menu.name,
          qty: item.qty,
          unitPrice: unitPriceDec.toFixed(2),
          ingredientCostActual: itemIngCost.toFixed(2),
          overheadAllocated: itemOverhead.toFixed(2),
        });
      }

      sales.push({
        id: saleId,
        businessId,
        invoiceNo,
        idempotencyKey,
        soldAt,
        cashierId,
        paymentMethod,
        totalAmount: totalAmountDec.toFixed(2),
        totalIngredientCost: totalIngCostDec.toFixed(2),
        totalOverhead: totalOverheadDec.toFixed(2),
        status: "COMPLETED",
        createdAt: soldAt,
        items: saleItems,
      });

      saleSeq++;
    }
  }

  const totalPortions = Object.values(menuPortionCounts).reduce((a, b) => a + b, 0);

  return {
    sales,
    totalPortions,
    menuPortions: menuPortionCounts,
  };
}
