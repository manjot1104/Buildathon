import { describe, expect, it } from "vitest";
import {
  computeBreakdown,
  formatMoney,
  fromMinor,
  lineAmount,
  toMinor,
} from "./index";

describe("money", () => {
  it("converts major to minor units safely", () => {
    expect(toMinor(10.5)).toBe(1050);
    expect(toMinor(99.99)).toBe(9999);
    expect(fromMinor(1050)).toBe(10.5);
  });

  it("computes line amounts with fractional quantities", () => {
    expect(lineAmount(1.5, 10000)).toBe(15000);
    expect(lineAmount(2, 49900)).toBe(99800);
  });

  it("rejects negative quantities", () => {
    expect(() => lineAmount(-1, 100)).toThrow();
  });

  it("computes breakdown with tax basis points", () => {
    const b = computeBreakdown({
      lineAmounts: [10000, 5000],
      discountMinor: 1000,
      feesMinor: 500,
      taxRateBps: 1800,
    });
    // taxable = 15000 - 1000 + 500 = 14500; tax = round(14500 * 0.18) = 2610
    expect(b.subtotalMinor).toBe(15000);
    expect(b.taxMinor).toBe(2610);
    expect(b.totalMinor).toBe(17110);
  });

  it("rejects discount exceeding subtotal", () => {
    expect(() =>
      computeBreakdown({ lineAmounts: [100], discountMinor: 200 })
    ).toThrow();
  });

  it("formats INR currency", () => {
    const formatted = formatMoney(199900, "INR");
    expect(formatted).toContain("1,999");
  });
});
