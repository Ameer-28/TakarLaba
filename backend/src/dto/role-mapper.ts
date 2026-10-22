import type { Role } from "../types/express.js";

export interface CostSensitiveItem {
  id: string;
  name: string;
  sellingPrice: string | number;
  costPerBase?: string | number | null;
  purchaseUnitPrice?: string | number | null;
  hppBahan?: string | number | null;
  hppPenuh?: string | number | null;
  marginKontribusi?: string | number | null;
  marginPercent?: string | number | null;
  [key: string]: unknown;
}

export type CashierSafeItem<T> = Omit<
  T,
  | "costPerBase"
  | "purchaseUnitPrice"
  | "hppBahan"
  | "hppPenuh"
  | "marginKontribusi"
  | "marginPercent"
>;

/**
 * Strips cost and margin fields when role is CASHIER (AGENTS.md Rule 7).
 * When role is OWNER, returns full data.
 */
export function sanitizeForRole<T extends CostSensitiveItem>(
  item: T,
  role: Role
): CashierSafeItem<T> | T {
  if (role === "CASHIER") {
    const safeItem = { ...item };
    delete safeItem.costPerBase;
    delete safeItem.purchaseUnitPrice;
    delete safeItem.hppBahan;
    delete safeItem.hppPenuh;
    delete safeItem.marginKontribusi;
    delete safeItem.marginPercent;
    return safeItem;
  }
  return item;
}

/**
 * Strips cost and margin fields for a list of items for CASHIER.
 */
export function sanitizeListForRole<T extends CostSensitiveItem>(
  items: T[],
  role: Role
): (CashierSafeItem<T> | T)[] {
  return items.map((item) => sanitizeForRole(item, role));
}
