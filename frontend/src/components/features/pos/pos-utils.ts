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
