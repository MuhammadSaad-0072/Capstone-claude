import type { Analysis, ExplainFocus, MarketSeries } from "./types";

export const DISCLAIMER =
  "Educational information only. These are calculations on past prices, not predictions or financial advice.";

export function buildInputsUsed(series: MarketSeries, a: Analysis): { label: string; value: string }[] {
  const s = a.snapshot;
  const fmt = (n: number | null, suffix = "") => (n === null ? "not available" : `${n}${suffix}`);
  return [
    { label: "Data as of", value: `${a.asOfDate} (${series.status}, source: ${series.source})` },
    { label: "Latest close", value: `$${s.lastClose}` },
    { label: "SMA 20 / SMA 50", value: `${fmt(s.sma20)} / ${fmt(s.sma50)}` },
    { label: "RSI (14)", value: fmt(s.rsi14) },
    { label: "20-day change", value: fmt(s.change20d, "%") },
    { label: "Volatility (20-day, annualized)", value: fmt(s.volatility20d, "%") },
    { label: "Loaded-period high / low", value: `$${s.periodHigh} / $${s.periodLow}` },
  ];
}

const FOCUS_PREFIX: Record<ExplainFocus, string[]> = {
  overview: ["trend", "momentum", "risk"],
  trend: ["trend"],
  momentum: ["momentum"],
  risk: ["risk"],
};

/** Plain, rule-based summary used when no AI service is available. */
export function fallbackText(series: MarketSeries, a: Analysis, focus: ExplainFocus = "overview"): string {
  const prefixes = FOCUS_PREFIX[focus];
  const picked = a.observations.filter((o) => prefixes.some((p) => o.id.startsWith(p)));
  const parts = (picked.length ? picked : a.observations).map((o) => o.text);
  const caveat =
    series.status === "mock"
      ? " Note: this is simulated demo data, not real market data."
      : series.status === "stale"
        ? " Note: the data may be out of date."
        : "";
  return `Rule-based summary for ${series.symbol} as of ${a.asOfDate}. ${parts.join(" ")}${caveat} ${DISCLAIMER}`;
}
