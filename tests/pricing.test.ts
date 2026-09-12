import { describe, expect, it } from "vitest";
import { calculatePricing } from "../src/lib/utils";

describe("calculatePricing", () => {
  it("applies service fee and tax in minor units", () => {
    const result = calculatePricing(10_000);
    expect(result.subtotalMinor).toBe(10_000);
    expect(result.serviceFeeMinor).toBe(600);
    expect(result.taxMinor).toBe(800);
    expect(result.totalMinor).toBe(11_400);
  });

  it("works for odd subtotals with integer rounding", () => {
    const result = calculatePricing(1_999);
    expect(result.serviceFeeMinor).toBe(Math.round(1_999 * 0.06));
    expect(result.taxMinor).toBe(Math.round(1_999 * 0.08));
    expect(result.totalMinor).toBe(result.subtotalMinor + result.serviceFeeMinor + result.taxMinor);
  });
});
