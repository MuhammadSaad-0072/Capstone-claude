"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalysisSeriesPoint } from "@/lib/types";
import { fmtNum, fmtUsd } from "@/lib/format";

const RANGES = [
  { label: "1M", n: 21 },
  { label: "3M", n: 63 },
  { label: "6M", n: 126 },
  { label: "All loaded", n: 0 },
];

export default function PriceChart({ points, symbol }: { points: AnalysisSeriesPoint[]; symbol: string }) {
  const [range, setRange] = useState("6M");
  const n = RANGES.find((r) => r.label === range)?.n ?? 0;
  const shown = useMemo(() => (n === 0 ? points : points.slice(-n)), [points, n]);
  if (shown.length === 0) return null;

  const first = shown[0];
  const last = shown[shown.length - 1];
  const summary = `${symbol} closing price from ${first.date} to ${last.date}, moving from ${fmtUsd(first.close)} to ${fmtUsd(last.close)}. Dashed lines show the 20-day and 50-day averages.`;

  return (
    <section aria-labelledby="chart-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="chart-title" className="text-lg">
          Price history
        </h2>
        <div role="group" aria-label="Time range" className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              aria-pressed={r.label === range}
              onClick={() => setRange(r.label)}
              className={`btn px-3 py-1 ${r.label === range ? "btn-primary" : "btn-quiet border-rule"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div role="img" aria-label={summary} className="mt-3 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={shown} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#D3DAD4" strokeDasharray="2 4" />
            <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} minTickGap={32} tick={{ fontSize: 12, fill: "#55626C" }} />
            <YAxis domain={["auto", "auto"]} tickFormatter={(v: number) => `$${Math.round(v)}`} width={56} tick={{ fontSize: 12, fill: "#55626C" }} />
            <Tooltip formatter={(value) => (typeof value === "number" ? fmtUsd(value) : String(value))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="close" name="Close" stroke="#17212B" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="sma20" name="20-day average" stroke="#1F3A5F" strokeWidth={1.5} strokeDasharray="6 3" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="sma50" name="50-day average" stroke="#8A5A0B" strokeWidth={1.5} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted">{summary}</p>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-muted">View the latest values as a table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full">
            <caption className="sr-only">Latest closing prices and averages for {symbol}</caption>
            <thead>
              <tr>
                <th className="th" scope="col">Date</th>
                <th className="th" scope="col">Close</th>
                <th className="th" scope="col">20-day average</th>
                <th className="th" scope="col">50-day average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {shown.slice(-12).reverse().map((p) => (
                <tr key={p.date}>
                  <td className="td num">{p.date}</td>
                  <td className="td num">{fmtNum(p.close)}</td>
                  <td className="td num">{fmtNum(p.sma20)}</td>
                  <td className="td num">{fmtNum(p.sma50)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
