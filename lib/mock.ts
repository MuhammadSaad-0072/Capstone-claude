import type { Candle } from "./types";

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const DAY = 86400000;

/**
 * Deterministic, simulated daily candles. The same symbol and date always give the same series.
 * These are NOT real prices. They exist so the app can be demonstrated without any API key.
 */
export function generateMockCandles(symbol: string, today: Date = new Date(), count = 260): Candle[] {
  const seed = hash(symbol.toUpperCase());
  const rand = mulberry32(seed);
  const start = Date.UTC(2023, 0, 2);
  const endDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const base = 40 + (seed % 360);
  const drift = 0.0003 + ((seed >>> 8) % 100) / 100000;
  const vol = 0.011 + ((seed >>> 16) % 100) / 10000;

  let price = base;
  const all: Candle[] = [];
  for (let t = start; t <= endDay; t += DAY) {
    const dow = new Date(t).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const shock = (rand() + rand() + rand() - 1.5) * 2;
    const ret = drift + vol * shock;
    const open = price * (1 + (rand() - 0.5) * 0.004);
    const close = Math.max(1, price * (1 + ret));
    const high = Math.max(open, close) * (1 + rand() * 0.008);
    const low = Math.min(open, close) * (1 - rand() * 0.008);
    const volume = Math.round((2e6 + rand() * 8e6) * (1 + Math.abs(ret) * 20));
    all.push({
      date: new Date(t).toISOString().slice(0, 10),
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume,
    });
    price = close;
  }
  return all.slice(-count);
}
