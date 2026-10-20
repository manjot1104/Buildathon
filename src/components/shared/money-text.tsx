import { formatMoney, type MoneyMinor } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

export interface MoneyTextProps {
  amountMinor: MoneyMinor;
  currency: string;
  locale?: string;
  fractionDigits?: number;
  className?: string;
}

export function MoneyText({
  amountMinor,
  currency,
  locale = "en-IN",
  fractionDigits = 2,
  className,
}: MoneyTextProps) {
  const formatted = formatMoney(amountMinor, currency, locale, fractionDigits);

  return (
    <span className={cn("tabular-nums", className)} title={`${amountMinor} minor units`}>
      {formatted}
    </span>
  );
}
