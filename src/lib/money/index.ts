/**
 * Money helpers using integer minor units (e.g. cents, paise).
 * Never use floating-point for financial calculations.
 */

export type MoneyMinor = number;

export interface MoneyLineItem {
  description: string;
  quantity: number; // scaled by 1000 for fractional qty support (e.g. 1.5h = 1500)
  unit: string;
  rateMinor: MoneyMinor;
  amountMinor: MoneyMinor;
}

export interface MoneyBreakdown {
  subtotalMinor: MoneyMinor;
  discountMinor: MoneyMinor;
  feesMinor: MoneyMinor;
  taxMinor: MoneyMinor;
  totalMinor: MoneyMinor;
}

const QTY_SCALE = 1000;

export function toMinor(major: number, fractionDigits = 2): MoneyMinor {
  if (!Number.isFinite(major)) throw new Error("Invalid money amount");
  const factor = 10 ** fractionDigits;
  return Math.round(major * factor);
}

export function fromMinor(minor: MoneyMinor, fractionDigits = 2): number {
  const factor = 10 ** fractionDigits;
  return minor / factor;
}

export function formatMoney(
  minor: MoneyMinor,
  currency: string,
  locale = "en-IN",
  fractionDigits = 2
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(fromMinor(minor, fractionDigits));
}

export function quantityToScaled(qty: number): number {
  if (!Number.isFinite(qty) || qty < 0) throw new Error("Invalid quantity");
  return Math.round(qty * QTY_SCALE);
}

export function scaledToQuantity(scaled: number): number {
  return scaled / QTY_SCALE;
}

/** amount = quantity * rate (both in minor units math) */
export function lineAmount(quantity: number, rateMinor: MoneyMinor): MoneyMinor {
  if (quantity < 0 || rateMinor < 0) throw new Error("Negative values not allowed");
  const scaled = quantityToScaled(quantity);
  return Math.round((scaled * rateMinor) / QTY_SCALE);
}

export function sumMinor(values: MoneyMinor[]): MoneyMinor {
  return values.reduce((acc, v) => {
    if (!Number.isInteger(v)) throw new Error("Money values must be integers");
    return acc + v;
  }, 0);
}

export function computeBreakdown(input: {
  lineAmounts: MoneyMinor[];
  discountMinor?: MoneyMinor;
  feesMinor?: MoneyMinor;
  taxRateBps?: number; // basis points, e.g. 1800 = 18%
  taxMinor?: MoneyMinor; // explicit tax overrides rate
}): MoneyBreakdown {
  const subtotalMinor = sumMinor(input.lineAmounts);
  const discountMinor = input.discountMinor ?? 0;
  const feesMinor = input.feesMinor ?? 0;

  if (discountMinor < 0 || feesMinor < 0) throw new Error("Negative fees/discount not allowed");
  if (discountMinor > subtotalMinor) throw new Error("Discount cannot exceed subtotal");

  const taxable = subtotalMinor - discountMinor + feesMinor;
  let taxMinor = input.taxMinor ?? 0;
  if (input.taxMinor === undefined && input.taxRateBps !== undefined) {
    if (input.taxRateBps < 0 || input.taxRateBps > 100_000) {
      throw new Error("Invalid tax rate");
    }
    taxMinor = Math.round((taxable * input.taxRateBps) / 10_000);
  }
  if (taxMinor < 0) throw new Error("Negative tax not allowed");

  return {
    subtotalMinor,
    discountMinor,
    feesMinor,
    taxMinor,
    totalMinor: taxable + taxMinor,
  };
}

export function assertSameCurrency(a: string, b: string): void {
  if (a.toUpperCase() !== b.toUpperCase()) {
    throw new Error(`Currency mismatch: ${a} vs ${b}`);
  }
}
