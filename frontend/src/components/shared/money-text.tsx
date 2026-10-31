import { formatRupiah } from "@/lib/format";

export interface MoneyTextProps {
  amount: number | string | bigint | null | undefined;
  showDecimals?: boolean;
  showSign?: boolean;
  highlightTrend?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function MoneyText({
  amount,
  showDecimals = false,
  showSign = false,
  highlightTrend = false,
  prefix,
  suffix,
  className = "",
}: MoneyTextProps) {
  const numeric = typeof amount === "number" ? amount : Number(amount ?? 0);
  const formatted = formatRupiah(amount, showDecimals);

  let sign = "";
  let trendColor = "";

  if (highlightTrend && Number.isFinite(numeric)) {
    if (numeric > 0) {
      sign = showSign ? "+" : "";
      trendColor = "text-emerald-600 dark:text-emerald-400 font-semibold";
    } else if (numeric < 0) {
      sign = showSign ? "-" : "";
      trendColor = "text-rose-600 dark:text-rose-400 font-semibold";
    } else {
      trendColor = "text-zinc-600 dark:text-zinc-400";
    }
  }

  return (
    <span className={`tabular-nums ${trendColor} ${className}`}>
      {prefix}
      {sign}
      {formatted}
      {suffix}
    </span>
  );
}
