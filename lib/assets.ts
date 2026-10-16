import type { Asset } from "./types";

export const ASSETS: Asset[] = [
  { symbol: "AAPL", name: "Apple", kind: "stock" },
  { symbol: "MSFT", name: "Microsoft", kind: "stock" },
  { symbol: "GOOGL", name: "Alphabet (Google)", kind: "stock" },
  { symbol: "AMZN", name: "Amazon", kind: "stock" },
  { symbol: "NVDA", name: "NVIDIA", kind: "stock" },
  { symbol: "TSLA", name: "Tesla", kind: "stock" },
  { symbol: "META", name: "Meta Platforms", kind: "stock" },
  { symbol: "NFLX", name: "Netflix", kind: "stock" },
  { symbol: "AMD", name: "Advanced Micro Devices", kind: "stock" },
  { symbol: "INTC", name: "Intel", kind: "stock" },
  { symbol: "JPM", name: "JPMorgan Chase", kind: "stock" },
  { symbol: "V", name: "Visa", kind: "stock" },
  { symbol: "KO", name: "Coca-Cola", kind: "stock" },
  { symbol: "DIS", name: "Walt Disney", kind: "stock" },
  { symbol: "WMT", name: "Walmart", kind: "stock" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", kind: "etf" },
  { symbol: "QQQ", name: "Invesco QQQ (Nasdaq-100) ETF", kind: "etf" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", kind: "etf" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", kind: "etf" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF", kind: "etf" },
];

export function findAsset(symbol: string): Asset | undefined {
  const s = symbol.trim().toUpperCase();
  return ASSETS.find((a) => a.symbol === s);
}

export function searchAssets(query: string): Asset[] {
  const q = query.trim().toLowerCase();
  if (!q) return ASSETS;
  return ASSETS.filter((a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
}
