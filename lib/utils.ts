import { CURRENCY, formatMoney } from "./i18n";

export function fmt(n: string | number) {
  return formatMoney(n);
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString(CURRENCY.locale, { day: "2-digit", month: "short" });
}
