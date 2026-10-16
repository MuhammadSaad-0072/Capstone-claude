import type { DataStatus, MarketSeries } from "@/lib/types";
import { fmtDate, fmtDateTime } from "@/lib/format";

const STYLE: Record<DataStatus, { label: string; cls: string }> = {
  live: { label: "Live end-of-day data", cls: "border-gain text-gain" },
  cached: { label: "Cached data", cls: "border-navy text-navy" },
  stale: { label: "Stale data", cls: "border-caution text-caution" },
  mock: { label: "Demo data (simulated)", cls: "border-caution text-caution" },
};

export function StatusPill({ status }: { status: DataStatus | "unavailable" }) {
  if (status === "unavailable") {
    return <span className="inline-block rounded-sm border border-loss px-2 py-0.5 text-xs font-medium text-loss">No price</span>;
  }
  const s = STYLE[status];
  return <span className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export default function DataBadge({ series }: { series: MarketSeries }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StatusPill status={series.status} />
        <span className="text-xs text-muted">
          Source: {series.source === "alphavantage" ? "Alpha Vantage" : "built-in simulator"}. Latest close {fmtDate(series.asOfDate)}.
          Fetched {fmtDateTime(series.lastUpdated)}.
        </span>
      </div>
      {series.warning && (
        <p role="status" className="text-xs text-caution">
          {series.warning}
        </p>
      )}
    </div>
  );
}
