import { describe, it, expect } from "vitest";

describe("Dashboard Chart Calculations (T-107)", () => {
  const mock7Days = [
    {
      date: "2026-10-25",
      dayName: "Min",
      label: "25 Okt",
      omzet: "100000.00",
      portionCount: 5,
      transactionCount: 3,
    },
    {
      date: "2026-10-26",
      dayName: "Sen",
      label: "26 Okt",
      omzet: "150000.00",
      portionCount: 8,
      transactionCount: 4,
    },
    {
      date: "2026-10-27",
      dayName: "Sel",
      label: "27 Okt",
      omzet: "80000.00",
      portionCount: 4,
      transactionCount: 2,
    },
    {
      date: "2026-10-28",
      dayName: "Rab",
      label: "28 Okt",
      omzet: "200000.00",
      portionCount: 10,
      transactionCount: 6,
    },
    {
      date: "2026-10-29",
      dayName: "Kam",
      label: "29 Okt",
      omzet: "120000.00",
      portionCount: 6,
      transactionCount: 3,
    },
    {
      date: "2026-10-30",
      dayName: "Jum",
      label: "30 Okt",
      omzet: "170000.00",
      portionCount: 9,
      transactionCount: 5,
    },
    {
      date: "2026-10-31",
      dayName: "Sab",
      label: "31 Okt",
      omzet: "250000.00",
      portionCount: 12,
      transactionCount: 8,
    },
  ];

  it("calculates 7-day cumulative omzet, portions, and transactions accurately", () => {
    const totalOmzet = mock7Days.reduce((sum, d) => sum + (Number.parseFloat(d.omzet) || 0), 0);
    const totalPortions = mock7Days.reduce((sum, d) => sum + d.portionCount, 0);
    const totalTransactions = mock7Days.reduce((sum, d) => sum + d.transactionCount, 0);

    expect(totalOmzet).toBe(1070000);
    expect(totalPortions).toBe(54);
    expect(totalTransactions).toBe(31);
  });

  it("calculates daily average omzet correctly", () => {
    const totalOmzet = mock7Days.reduce((sum, d) => sum + (Number.parseFloat(d.omzet) || 0), 0);
    const dailyAverage = totalOmzet / 7;
    expect(Math.round(dailyAverage)).toBe(152857);
  });

  it("identifies peak day for proportional bar height calculations", () => {
    const maxOmzet = Math.max(...mock7Days.map((d) => Number.parseFloat(d.omzet) || 0), 1000);
    expect(maxOmzet).toBe(250000);

    // Day with 250000 should be 100%
    const heightPeak = Math.max(Math.round((250000 / maxOmzet) * 100), 4);
    expect(heightPeak).toBe(100);

    // Day with 100000 should be 40%
    const heightMin = Math.max(Math.round((100000 / maxOmzet) * 100), 4);
    expect(heightMin).toBe(40);

    // Day with 0 should maintain minimum threshold of 4%
    const heightZero = Math.max(Math.round((0 / maxOmzet) * 100), 4);
    expect(heightZero).toBe(4);
  });

  it("computes relative popularity bars for top menus correctly", () => {
    const topMenus = [
      { menuId: "m1", menuName: "Es Kopi Susu Aren", totalQty: 50, totalRevenue: "900000.00" },
      { menuId: "m2", menuName: "Americano", totalQty: 25, totalRevenue: "375000.00" },
      { menuId: "m3", menuName: "Croissant Butter", totalQty: 10, totalRevenue: "200000.00" },
    ];

    const maxQty = Math.max(...topMenus.map((m) => m.totalQty), 1);
    expect(maxQty).toBe(50);

    const percent1 = Math.round((topMenus[0]!.totalQty / maxQty) * 100);
    const percent2 = Math.round((topMenus[1]!.totalQty / maxQty) * 100);
    const percent3 = Math.round((topMenus[2]!.totalQty / maxQty) * 100);

    expect(percent1).toBe(100);
    expect(percent2).toBe(50);
    expect(percent3).toBe(20);
  });

  it("transforms 7-day sales records into Recharts LineChart data structure accurately", () => {
    const chartData = mock7Days.map((d) => ({
      date: d.date,
      dayName: d.dayName,
      label: d.label,
      omzet: Number.parseFloat(d.omzet) || 0,
      portionCount: d.portionCount,
      transactionCount: d.transactionCount,
    }));

    expect(chartData).toHaveLength(7);
    expect(chartData[0]).toEqual({
      date: "2026-10-25",
      dayName: "Min",
      label: "25 Okt",
      omzet: 100000,
      portionCount: 5,
      transactionCount: 3,
    });
    expect(chartData[6]!.omzet).toBe(250000);
  });
});
