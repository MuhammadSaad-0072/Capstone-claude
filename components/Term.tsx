import type { ReactNode } from "react";

export const DEFS = {
  SMA: "Simple moving average: the average closing price over the last N days. It smooths out day-to-day noise.",
  EMA: "Exponential moving average: like an SMA, but recent days count more.",
  RSI: "Relative Strength Index: a 0 to 100 gauge comparing recent gains with recent losses. Above 70 is often called overbought, below 30 oversold.",
  Volatility: "How much the price has been swinging. Higher volatility means bigger moves up and down.",
  Close: "The last price traded at the end of a trading day.",
  Candle: "One day of price data: the open, high, low and close, plus trading volume.",
  PaperTrading: "Practising with pretend money. Orders are recorded in this app only and never reach a broker.",
  AverageCost: "The average price you paid per share across your buys, used to measure profit or loss.",
  Unrealized: "Profit or loss on shares you still hold, based on the latest close. It changes until you sell.",
  Realized: "Profit or loss locked in by selling shares.",
  Stale: "Data that may be out of date because it could not be refreshed or its latest point is old.",
} as const;

export type TermKey = keyof typeof DEFS;

export default function Term({ k, children }: { k: TermKey; children?: ReactNode }) {
  return (
    <abbr title={DEFS[k]} className="cursor-help underline decoration-dotted underline-offset-4">
      {children ?? k}
    </abbr>
  );
}
