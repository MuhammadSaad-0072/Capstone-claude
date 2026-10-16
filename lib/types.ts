export type DataStatus = "live" | "cached" | "stale" | "mock";

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSeries {
  symbol: string;
  name: string;
  currency: string;
  source: "alphavantage" | "mock";
  status: DataStatus;
  lastUpdated: string;
  asOfDate: string;
  candles: Candle[];
  warning?: string;
}

export interface Asset {
  symbol: string;
  name: string;
  kind: "stock" | "etf";
}

export type Tone = "neutral" | "info" | "caution";

export interface Observation {
  id: string;
  title: string;
  text: string;
  method: string;
  values: Record<string, string | number | null>;
  tone: Tone;
}

export interface IndicatorSnapshot {
  lastClose: number;
  sma20: number | null;
  sma50: number | null;
  ema12: number | null;
  ema26: number | null;
  rsi14: number | null;
  change20d: number | null;
  volatility20d: number | null;
  periodHigh: number;
  periodLow: number;
  avgVolume20: number | null;
}

export interface AnalysisSeriesPoint {
  date: string;
  close: number;
  sma20: number | null;
  sma50: number | null;
  rsi14: number | null;
}

export interface Analysis {
  symbol: string;
  asOfDate: string;
  snapshot: IndicatorSnapshot;
  points: AnalysisSeriesPoint[];
  observations: Observation[];
}

export type Side = "buy" | "sell";
export type ExplainFocus = "overview" | "trend" | "momentum" | "risk";

export interface Trade {
  id: string;
  clientId: string;
  symbol: string;
  side: Side;
  quantity: number;
  price: number;
  dataSource: string;
  dataStatus: DataStatus;
  note: string | null;
  executedAt: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgCost: number;
  lastPrice: number | null;
  marketValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPct: number | null;
  priceStatus: DataStatus | "unavailable";
}

export interface PortfolioSummary {
  startingCash: number;
  cash: number;
  positionsValue: number;
  totalValue: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalReturnPct: number;
  positions: Position[];
}

export interface Explanation {
  mode: "ai" | "fallback";
  text: string;
  inputsUsed: { label: string; value: string }[];
  model?: string;
  warning?: string;
  generatedAt: string;
}
