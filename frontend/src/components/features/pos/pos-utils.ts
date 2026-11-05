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

export function isBeverageMenu(name: string, category: string | null): boolean {
  const cat = category?.toLowerCase().trim() ?? "";
  if (
    cat === "makanan" ||
    cat === "food" ||
    cat === "snack" ||
    cat === "snacks" ||
    cat === "pastry" ||
    cat === "dessert" ||
    cat === "desserts"
  ) {
    return false;
  }

  if (
    cat === "minuman" ||
    cat === "beverage" ||
    cat === "beverages" ||
    cat === "drink" ||
    cat === "drinks" ||
    cat === "coffee" ||
    cat === "non coffee" ||
    cat === "tea"
  ) {
    return true;
  }

  const text = name.toLowerCase();
  if (
    text.startsWith("roti ") ||
    text.startsWith("nasi ") ||
    text.startsWith("mie ") ||
    text.includes("burger") ||
    text.includes("croissant") ||
    text.includes("cake") ||
    text.includes("sandwich")
  ) {
    return false;
  }

  return (
    text.includes("kopi") ||
    text.includes("coffee") ||
    text.includes("espresso") ||
    text.includes("latte") ||
    text.includes("cappuccino") ||
    text.includes("v60") ||
    text.includes("americano") ||
    text.includes("teh") ||
    text.includes("tea") ||
    text.includes("jus") ||
    text.includes("juice") ||
    text.includes("soda") ||
    text.includes("minuman") ||
    text.includes("drink") ||
    text.includes("boba") ||
    text.includes("matcha") ||
    text.includes("es ") ||
    text.endsWith(" ice") ||
    text.includes("iced")
  );
}

export function getDefaultTemperature(name: string): "ICE" | "HOT" {
  const text = name.toLowerCase();
  if (
    text.includes("panas") ||
    text.includes("hot") ||
    text.includes("hangat") ||
    text.includes("v60")
  ) {
    return "HOT";
  }
  return "ICE";
}

/**
 * Strips leading "Es " from beverage menu names for POS display,
 * because POS includes an explicit Dingin / Panas selector.
 */
export function formatPosMenuName(name: string): string {
  return name.replace(/^Es\s+/i, "").trim();
}
