import type { Candle, MarketSeries } from "./types";
import { findAsset } from "./assets";
import { generateMockCandles } from "./mock";
import { HttpError, safeMessage } from "./errors";
import { logger } from "./logger";

interface CacheEntry {
  series: MarketSeries;
  fetchedAt: number;
}

type Store = {
  cache: Map<string, CacheEntry>;
  inflight: Map<string, Promise<MarketSeries>>;
};

const g = globalThis as unknown as { __marketStore?: Store };
const store: Store = g.__marketStore ?? { cache: new Map(), inflight: new Map() };
g.__marketStore = store;

const OLD_DATA_DAYS = 7;

function ttlMs(): number {
  const s = Number(process.env.MARKET_CACHE_TTL_SECONDS ?? 21600);
  return (Number.isFinite(s) && s >= 0 ? s : 21600) * 1000;
}

export function marketMode(): "alphavantage" | "mock" {
  const p = (process.env.MARKET_DATA_PROVIDER ?? "auto").toLowerCase();
  if (p === "mock") return "mock";
  return process.env.ALPHAVANTAGE_API_KEY ? "alphavantage" : "mock";
}

/** Parse an Alpha Vantage TIME_SERIES_DAILY response. Throws a readable error for limit or error payloads. */
export function parseAlphaVantageDaily(json: unknown): Candle[] {
  const obj = (json ?? {}) as Record<string, unknown>;
  const series = obj["Time Series (Daily)"] as Record<string, Record<string, string>> | undefined;
  if (!series || typeof series !== "object") {
    const msg =
      (typeof obj["Note"] === "string" && obj["Note"]) ||
      (typeof obj["Information"] === "string" && obj["Information"]) ||
      (typeof obj["Error Message"] === "string" && obj["Error Message"]) ||
      "Unexpected response from the market data provider.";
    throw new Error(String(msg).slice(0, 160));
  }
  const candles: Candle[] = [];
  for (const [date, row] of Object.entries(series)) {
    const open = Number(row["1. open"]);
    const high = Number(row["2. high"]);
    const low = Number(row["3. low"]);
    const close = Number(row["4. close"]);
    const volume = Number(row["5. volume"]);
    if (![open, high, low, close, volume].every(Number.isFinite) || close <= 0) continue;
    candles.push({ date, open, high, low, close, volume });
  }
  candles.sort((a, b) => a.date.localeCompare(b.date));
  if (candles.length < 30) throw new Error("The provider returned too little history for analysis.");
  return candles;
}

async function fetchAlphaVantage(symbol: string, name: string): Promise<MarketSeries> {
  const key = process.env.ALPHAVANTAGE_API_KEY as string;
  const url =
    "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&outputsize=compact" +
    `&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000), cache: "no-store" });
  if (!res.ok) throw new Error(`Market data provider returned HTTP ${res.status}.`);
  const candles = parseAlphaVantageDaily(await res.json());
  return {
    symbol,
    name,
    currency: "USD",
    source: "alphavantage",
    status: "live",
    lastUpdated: new Date().toISOString(),
    asOfDate: candles[candles.length - 1].date,
    candles,
  };
}

function buildMock(symbol: string, name: string, warning?: string): MarketSeries {
  const candles = generateMockCandles(symbol);
  return {
    symbol,
    name,
    currency: "USD",
    source: "mock",
    status: "mock",
    lastUpdated: new Date().toISOString(),
    asOfDate: candles[candles.length - 1].date,
    candles,
    warning: warning ?? "Demo data: simulated prices, not real market data.",
  };
}

function ageDays(asOfDate: string): number {
  const t = Date.parse(asOfDate + "T00:00:00Z");
  return Number.isFinite(t) ? (Date.now() - t) / 86400000 : 0;
}

function withAgeCheck(series: MarketSeries): MarketSeries {
  if (series.source !== "mock" && series.status !== "stale" && ageDays(series.asOfDate) > OLD_DATA_DAYS) {
    return {
      ...series,
      status: "stale",
      warning: `The latest data point is dated ${series.asOfDate}, which is more than ${OLD_DATA_DAYS} days ago.`,
    };
  }
  return series;
}

export async function getSeries(rawSymbol: string): Promise<MarketSeries> {
  const asset = findAsset(rawSymbol);
  if (!asset) {
    throw new HttpError(404, "unsupported_symbol", `"${rawSymbol.slice(0, 12)}" is not in the supported list. Pick an asset from the list.`);
  }
  const symbol = asset.symbol;

  if (marketMode() === "mock") return buildMock(symbol, asset.name);

  const cached = store.cache.get(symbol);
  if (cached && Date.now() - cached.fetchedAt < ttlMs()) {
    return withAgeCheck({ ...cached.series, status: "cached" });
  }

  let pending = store.inflight.get(symbol);
  if (!pending) {
    pending = fetchAlphaVantage(symbol, asset.name).finally(() => store.inflight.delete(symbol));
    store.inflight.set(symbol, pending);
  }

  try {
    const live = await pending;
    store.cache.set(symbol, { series: live, fetchedAt: Date.now() });
    return withAgeCheck(live);
  } catch (err) {
    const reason = safeMessage(err);
    logger.warn("market data fetch failed", { symbol, reason });
    if (cached) {
      return {
        ...cached.series,
        status: "stale",
        warning: `Refreshing live data failed (${reason}) Showing the last data fetched at ${cached.series.lastUpdated}.`,
      };
    }
    return buildMock(symbol, asset.name, `Live data is unavailable right now (${reason}) Showing simulated demo data instead.`);
  }
}
