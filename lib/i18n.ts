export const CURRENCY = {
  symbol: "₦",
  code: "NGN",
  locale: "en-NG",
} as const;

export function formatMoney(value: string | number, opts?: { decimals?: number }) {
  const decimals = opts?.decimals ?? 2;
  const n = Number(value);
  if (!Number.isFinite(n)) return `${CURRENCY.symbol}0.00`;
  return `${CURRENCY.symbol}${n.toLocaleString(CURRENCY.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
