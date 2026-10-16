"use client";

import type { ReactNode } from "react";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import type { Analysis, MarketSeries } from "@/lib/types";
import { fmtCompact, fmtNum, fmtPct, fmtUsd } from "@/lib/format";
import AssetPicker from "@/components/AssetPicker";
import DataBadge from "@/components/DataBadge";
import PriceChart from "@/components/PriceChart";
import AnalysisPanel from "@/components/AnalysisPanel";
import ExplainPanel from "@/components/ExplainPanel";
import TradeForm from "@/components/TradeForm";
import Term from "@/components/Term";
import { DashboardSkeleton, ErrorBox } from "@/components/States";

interface AnalysisResponse {
  series: MarketSeries;
  analysis: Analysis;
}

export default function DashboardPage() {
  const [symbol, setSymbol] = useState("AAPL");
  const { data, error, loading, reload } = useApi<AnalysisResponse>(`/api/analysis/${symbol}`);

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside>
        <AssetPicker selected={symbol} onSelect={setSymbol} />
      </aside>
      <div className="min-w-0 space-y-10">
        {loading && <DashboardSkeleton />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {data && <Loaded data={data} />}
      </div>
    </div>
  );
}

function Loaded({ data }: { data: AnalysisResponse }) {
  const { series, analysis } = data;
  const s = analysis.snapshot;
  const candles = series.candles;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const dayChange = prev ? (last.close / prev.close - 1) * 100 : null;

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl">
          {series.name} <span className="num text-xl text-muted">{series.symbol}</span>
        </h1>
        <p className="num text-4xl font-medium">
          {fmtUsd(last.close)}
          <span className={`ml-3 text-base font-normal ${dayChange !== null && dayChange < 0 ? "text-loss" : "text-gain"}`}>
            {dayChange === null ? "" : `${fmtPct(dayChange)} vs previous close`}
          </span>
        </p>
        <DataBadge series={series} />
      </header>

      <PriceChart points={analysis.points} symbol={series.symbol} />

      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="text-lg">
          Basic statistics
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Loaded-period high" value={fmtUsd(s.periodHigh)} />
          <Stat label="Loaded-period low" value={fmtUsd(s.periodLow)} />
          <Stat label="Change over 20 sessions" value={fmtPct(s.change20d)} />
          <Stat label={<Term k="Volatility">Volatility (yearly)</Term>} value={s.volatility20d === null ? "n/a" : `${fmtNum(s.volatility20d, 1)}%`} />
          <Stat label="Average daily volume (20)" value={fmtCompact(s.avgVolume20)} />
        </dl>
        <p className="mt-2 text-xs text-muted">{candles.length} daily candles loaded. Statistics cover only the loaded period.</p>
      </section>

      <AnalysisPanel analysis={analysis} />

      <div className="grid gap-10 md:grid-cols-2">
        <ExplainPanel symbol={series.symbol} />
        <TradeForm symbol={series.symbol} price={last.close} status={series.status} />
      </div>
    </>
  );
}

function Stat({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num mt-0.5 text-lg">{value}</dd>
    </div>
  );
}
