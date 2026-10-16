"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Analysis } from "@/lib/types";
import Term from "./Term";

export default function AnalysisPanel({ analysis }: { analysis: Analysis }) {
  const rsiPoints = analysis.points.slice(-126).filter((p) => p.rsi14 !== null);
  return (
    <section aria-labelledby="analysis-title">
      <h2 id="analysis-title" className="text-lg">
        What the numbers show
      </h2>
      <p className="mt-1 max-w-prose text-sm text-muted">
        Every point below is a calculation on past prices. Open &quot;How this is calculated&quot; to see the method and the values used.
        Indicators can be wrong and do not predict future prices.
      </p>
      <ul className="mt-4 divide-y divide-rule border-y border-rule">
        {analysis.observations.map((o) => (
          <li key={o.id} className="py-4">
            <h3 className="flex flex-wrap items-center gap-2 text-base font-medium">
              {o.title}
              {o.tone === "caution" && <span className="rounded-sm border border-caution px-1.5 py-0.5 font-sans text-xs text-caution">Worth a closer look</span>}
            </h3>
            <p className="mt-1 max-w-prose text-sm">{o.text}</p>
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-muted">How this is calculated</summary>
              <p className="mt-2 max-w-prose text-muted">{o.method}</p>
              <dl className="mt-2 grid max-w-md grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(o.values).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted">{k}</dt>
                    <dd className="num">{v === null ? "n/a" : String(v)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </li>
        ))}
      </ul>

      {rsiPoints.length > 0 && (
        <div className="mt-6">
          <h3 className="text-base font-medium">
            <Term k="RSI">RSI (14)</Term> over the last six months
          </h3>
          <div
            role="img"
            aria-label={`RSI line chart. Latest value ${analysis.snapshot.rsi14 ?? "not available"}. Lines mark 30 and 70.`}
            className="mt-2 h-36 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rsiPoints} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#D3DAD4" strokeDasharray="2 4" />
                <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} minTickGap={40} tick={{ fontSize: 11, fill: "#55626C" }} />
                <YAxis domain={[0, 100]} ticks={[0, 30, 70, 100]} width={36} tick={{ fontSize: 11, fill: "#55626C" }} />
                <Tooltip />
                <ReferenceLine y={70} stroke="#8A5A0B" strokeDasharray="4 3" />
                <ReferenceLine y={30} stroke="#8A5A0B" strokeDasharray="4 3" />
                <Line type="monotone" dataKey="rsi14" name="RSI 14" stroke="#1F3A5F" strokeWidth={1.75} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
