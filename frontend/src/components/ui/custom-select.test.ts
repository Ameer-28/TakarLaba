import { describe, it, expect, vi } from "vitest";
import type { SelectOption } from "./custom-select";

describe("CustomSelect types and option handling", () => {
  it("structures options and allows selecting valid options", () => {
    const options: SelectOption<string>[] = [
      { value: "ALL", label: "Semua Kategori" },
      { value: "MAIN", label: "Bahan Utama", badge: 5 },
      { value: "SUPPORT", label: "Bahan Penolong" },
    ];

    expect(options).toHaveLength(3);
    expect(options[0]?.value).toBe("ALL");
    expect(options[1]?.badge).toBe(5);

    const onSelect = vi.fn();
    const handlePick = (val: string) => onSelect(val);

    handlePick(options[1]?.value ?? "");
    expect(onSelect).toHaveBeenCalledWith("MAIN");
  });

  it("supports numeric value options such as rounding steps", () => {
    const roundingOptions: SelectOption<number>[] = [
      { value: 1, label: "Tanpa Pembulatan (Rp1)" },
      { value: 50, label: "Rp50" },
      { value: 100, label: "Rp100" },
      { value: 500, label: "Rp500", badge: "Rekomendasi" },
      { value: 1000, label: "Rp1.000" },
    ];

    expect(roundingOptions).toHaveLength(5);
    const selected = roundingOptions.find((opt) => opt.value === 500);
    expect(selected?.badge).toBe("Rekomendasi");
  });
});
