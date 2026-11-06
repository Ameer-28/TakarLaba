import { describe, it, expect } from "vitest";
import { validateRecipeRows } from "./recipe-utils";

describe("validateRecipeRows", () => {
  it("rejects empty row list", () => {
    const result = validateRecipeRows([]);
    expect(result.error).toContain("at least 1 ingredient");
  });

  it("rejects row with empty ingredientId", () => {
    const result = validateRecipeRows([
      { rowId: "1", ingredientId: "", qtyUsable: "1", unitName: "gram" },
    ]);
    expect(result.error).toContain("not selected");
  });

  it("rejects non-positive quantity", () => {
    const result = validateRecipeRows([
      { rowId: "1", ingredientId: "ing-1", qtyUsable: "0", unitName: "gram" },
    ]);
    expect(result.error).toContain("greater than 0");
  });

  it("rejects duplicate ingredients", () => {
    const result = validateRecipeRows([
      { rowId: "1", ingredientId: "ing-1", qtyUsable: "100", unitName: "gram" },
      { rowId: "2", ingredientId: "ing-1", qtyUsable: "50", unitName: "gram" },
    ]);
    expect(result.error).toContain("Duplicate ingredients");
  });

  it("returns valid items when all rows are valid", () => {
    const result = validateRecipeRows([
      { rowId: "1", ingredientId: "ing-1", qtyUsable: "100", unitName: "gram" },
      { rowId: "2", ingredientId: "ing-2", qtyUsable: "2", unitName: "butir" },
    ]);
    expect(result.error).toBeNull();
    expect(result.validItems.length).toBe(2);
    expect(result.validItems[0]?.qtyUsable).toBe(100);
  });
});
