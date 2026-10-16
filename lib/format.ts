const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const fmtUsd = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? "n/a" : usd.format(n);

export const fmtPct = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined || !Number.isFinite(n) ? "n/a" : `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;

export const fmtNum = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "n/a"
    : n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtCompact = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "n/a"
    : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function fmtDate(iso: string): string {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
