"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client";
import { useApi } from "@/lib/useApi";
import type { PortfolioSummary, Trade } from "@/lib/types";
import { fmtDateTime, fmtNum, fmtPct, fmtUsd } from "@/lib/format";
import { EmptyState, ErrorBox, Skeleton } from "@/components/States";
import { StatusPill } from "@/components/DataBadge";
import Term from "@/components/Term";

interface PortfolioResponse {
  summary: PortfolioSummary;
  trades: Trade[];
  storage: "supabase" | "memory";
}

const sign = (n: number | null) => (n === null ? "" : n < 0 ? "text-loss" : n > 0 ? "text-gain" : "");

export default function PortfolioPage() {
  const { data, error, loading, reload } = useApi<PortfolioResponse>("/api/portfolio");
  const [resetError, setResetError] = useState<string | null>(null);

  async function reset() {
    if (!window.confirm("Reset your paper portfolio? All hypothetical trades will be deleted.")) return;
    setResetError(null);
    try {
      await api<{ reset: boolean }>("/api/portfolio", { method: "DELETE" });
      reload();
    } catch (e) {
      setResetError(e instanceof Error ? e.message : "Could not reset the portfolio.");
    }
  }

  return (
    <div className="space-y-10">
      <header className="max-w-prose space-y-2">
        <h1 className="text-3xl">Your paper portfolio</h1>
        <p className="text-sm text-muted">
          Hypothetical money only. You start with {fmtUsd(100000)} of pretend cash. Values use the last available close and are not real
          account balances.
        </p>
      </header>

      {loading && (
        <div role="status" className="space-y-4">
          <span className="sr-only">Loading portfolio</span>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {data && (
        <>
          {data.storage === "memory" && (
            <p role="status" className="border-l-4 border-caution bg-panel px-4 py-3 text-sm">
              Temporary storage is in use, so trades can disappear when the server restarts. Connect a database to keep them (see the README).
            </p>
          )}

          <section aria-labelledby="summary-title">
            <h2 id="summary-title" className="text-lg">
              Hypothetical value
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
              <Item label="Total value" value={fmtUsd(data.summary.totalValue)} />
              <Item label="Cash" value={fmtUsd(data.summary.cash)} />
              <Item label="Positions" value={fmtUsd(data.summary.positionsValue)} />
              <Item label={<Term k="Unrealized">Unrealized P/L</Term>} value={fmtUsd(data.summary.unrealizedPnl)} tone={sign(data.summary.unrealizedPnl)} />
              <Item label={<Term k="Realized">Realized P/L</Term>} value={fmtUsd(data.summary.realizedPnl)} tone={sign(data.summary.realizedPnl)} />
              <Item label="Total return" value={fmtPct(data.summary.totalReturnPct)} tone={sign(data.summary.totalReturnPct)} />
            </dl>
          </section>

          <section aria-labelledby="positions-title">
            <h2 id="positions-title" className="text-lg">
              Positions
            </h2>
            {data.summary.positions.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No open positions yet">
                  Pick an asset on the{" "}
                  <Link href="/" className="underline">
                    dashboard
                  </Link>{" "}
                  and record a hypothetical buy.
                </EmptyState>
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-rule">
                  <caption className="sr-only">Open positions</caption>
                  <thead>
                    <tr>
                      <th className="th" scope="col">Symbol</th>
                      <th className="th" scope="col">Shares</th>
                      <th className="th" scope="col"><Term k="AverageCost">Avg cost</Term></th>
                      <th className="th" scope="col">Last close</th>
                      <th className="th" scope="col">Value</th>
                      <th className="th" scope="col">P/L</th>
                      <th className="th" scope="col">P/L %</th>
                      <th className="th" scope="col">Price data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {data.summary.positions.map((p) => (
                      <tr key={p.symbol}>
                        <td className="td font-medium">{p.symbol}</td>
                        <td className="td num">{fmtNum(p.quantity, 4)}</td>
                        <td className="td num">{fmtUsd(p.avgCost)}</td>
                        <td className="td num">{fmtUsd(p.lastPrice)}</td>
                        <td className="td num">{fmtUsd(p.marketValue)}</td>
                        <td className={`td num ${sign(p.unrealizedPnl)}`}>{fmtUsd(p.unrealizedPnl)}</td>
                        <td className={`td num ${sign(p.unrealizedPct)}`}>{fmtPct(p.unrealizedPct)}</td>
                        <td className="td"><StatusPill status={p.priceStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-labelledby="history-title">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 id="history-title" className="text-lg">
                Transaction history
              </h2>
              <button type="button" className="btn btn-quiet border-rule" onClick={reset} disabled={data.trades.length === 0}>
                Reset portfolio
              </button>
            </div>
            {resetError && (
              <div className="mt-3">
                <ErrorBox message={resetError} />
              </div>
            )}
            {data.trades.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No trades recorded">Your hypothetical buys and sells will appear here.</EmptyState>
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-rule">
                  <caption className="sr-only">All recorded paper trades, newest first</caption>
                  <thead>
                    <tr>
                      <th className="th" scope="col">Time</th>
                      <th className="th" scope="col">Side</th>
                      <th className="th" scope="col">Symbol</th>
                      <th className="th" scope="col">Shares</th>
                      <th className="th" scope="col">Fill price</th>
                      <th className="th" scope="col">Price data</th>
                      <th className="th" scope="col">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {data.trades.map((t) => (
                      <tr key={t.id}>
                        <td className="td num">{fmtDateTime(t.executedAt)}</td>
                        <td className="td">{t.side === "buy" ? "Buy" : "Sell"}</td>
                        <td className="td font-medium">{t.symbol}</td>
                        <td className="td num">{fmtNum(t.quantity, 4)}</td>
                        <td className="td num">{fmtUsd(t.price)}</td>
                        <td className="td"><StatusPill status={t.dataStatus} /></td>
                        <td className="td max-w-[16rem] truncate">{t.note ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Item({ label, value, tone = "" }: { label: ReactNode; value: string; tone?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`num mt-0.5 text-lg ${tone}`}>{value}</dd>
    </div>
  );
}
