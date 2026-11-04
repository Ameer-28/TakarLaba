/**
 * Pure helper functions for POS screen calculations and options.
 */

export function calculateQuickCashOptions(totalAmount: number): number[] {
  const set = new Set<number>();
  set.add(totalAmount); // Uang pas

  const denominations = [10000, 20000, 50000, 100000];
  for (const denom of denominations) {
    if (denom >= totalAmount) {
      set.add(denom);
    } else {
      const nextRound = Math.ceil(totalAmount / denom) * denom;
      if (nextRound > totalAmount && nextRound <= 500000) {
        set.add(nextRound);
      }
    }
  }

  return Array.from(set)
    .sort((a, b) => a - b)
    .slice(0, 4);
}

export function formatPaymentMethodLabel(method: "CASH" | "QRIS" | "TRANSFER"): string {
  switch (method) {
    case "CASH":
      return "Tunai";
    case "QRIS":
      return "QRIS";
    case "TRANSFER":
      return "Transfer Bank";
  }
}

export function calculateCashChange(totalAmount: number, cashReceived: number) {
  const isInsufficient = cashReceived < totalAmount;
  const change = Math.max(0, cashReceived - totalAmount);
  const shortage = isInsufficient ? totalAmount - cashReceived : 0;
  return { isInsufficient, change, shortage };
}
