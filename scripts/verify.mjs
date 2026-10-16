// Offline verification of the pure logic: indicators, mock data, parsing, analysis, portfolio rules,
// explanation fallback and guards, rate limiting and the in-memory store. No network and no API keys needed.
// Run with:  npm run verify   (Node 22.6+; Node 22.18+ needs no flag)
import { register } from "node:module";
import assert from "node:assert/strict";

register("./ts-resolver.mjs", import.meta.url);

delete process.env.ALPHAVANTAGE_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const ind = await import("../lib/indicators.ts");
const { generateMockCandles } = await import("../lib/mock.ts");
const { analyze } = await import("../lib/analysis.ts");
const pf = await import("../lib/portfolio.ts");
const market = await import("../lib/market.ts");
const { explain } = await import("../lib/explain.ts");
const { rateLimit } = await import("../lib/ratelimit.ts");
const { getStore } = await import("../lib/store.ts");
const { HttpError } = await import("../lib/errors.ts");

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}\n       ${e.message}`);
    process.exitCode = 1;
  }
}

const FIXED = new Date("2026-10-16T12:00:00Z");

console.log("Indicators");
await test("SMA matches a hand-computed example", () => {
  assert.deepEqual(ind.sma([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
});
await test("EMA of a constant series stays constant", () => {
  const out = ind.ema(Array(30).fill(10), 12);
  assert.equal(out[11], 10);
  assert.equal(out[29], 10);
});
await test("RSI is 100 for a rising series and 0 for a falling series", () => {
  const up = Array.from({ length: 30 }, (_, i) => i + 1);
  const down = [...up].reverse();
  assert.equal(ind.rsi(up, 14).at(-1), 100);
  assert.equal(ind.rsi(down, 14).at(-1), 0);
});
await test("RSI stays within 0..100 on simulated data", () => {
  const closes = generateMockCandles("AAPL", FIXED).map((c) => c.close);
  for (const v of ind.rsi(closes, 14)) if (v !== null) assert.ok(v >= 0 && v <= 100);
});

console.log("Mock data");
await test("mock candles are deterministic, weekday-only and internally consistent", () => {
  const a = generateMockCandles("MSFT", FIXED);
  const b = generateMockCandles("MSFT", FIXED);
  assert.deepEqual(a, b);
  assert.equal(a.length, 260);
  for (const c of a) {
    const dow = new Date(c.date + "T00:00:00Z").getUTCDay();
    assert.ok(dow !== 0 && dow !== 6);
    assert.ok(c.high >= Math.max(c.open, c.close) - 0.011);
    assert.ok(c.low <= Math.min(c.open, c.close) + 0.011);
    assert.ok(c.close > 0 && c.volume > 0);
  }
});
await test("different symbols give different series", () => {
  assert.notDeepEqual(generateMockCandles("AAPL", FIXED).at(-1), generateMockCandles("TSLA", FIXED).at(-1));
});

console.log("Market data");
await test("Alpha Vantage payload is parsed and sorted oldest to newest", () => {
  const series = {};
  for (let i = 0; i < 40; i++) {
    const d = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    series[d] = { "1. open": "10", "2. high": "11", "3. low": "9", "4. close": String(10 + i / 10), "5. volume": "1000" };
  }
  const out = market.parseAlphaVantageDaily({ "Time Series (Daily)": series });
  assert.equal(out.length, 40);
  assert.ok(out[0].date < out[39].date);
});
await test("rate-limit and error payloads become readable errors", () => {
  assert.throws(() => market.parseAlphaVantageDaily({ Note: "Rate limit reached" }), /Rate limit reached/);
  assert.throws(() => market.parseAlphaVantageDaily({ "Error Message": "Invalid API call" }), /Invalid API call/);
  assert.throws(() => market.parseAlphaVantageDaily({}), /Unexpected response/);
});
await test("without an API key the app serves clearly labeled demo data", async () => {
  const s = await market.getSeries("aapl");
  assert.equal(s.source, "mock");
  assert.equal(s.status, "mock");
  assert.match(s.warning, /Demo data/);
});
await test("unsupported symbols are rejected with a 404", async () => {
  await assert.rejects(() => market.getSeries("ZZZZ"), (e) => e instanceof HttpError && e.status === 404);
});

console.log("Analysis");
await test("analysis produces indicators and educational observations", () => {
  const candles = generateMockCandles("NVDA", FIXED);
  const a = analyze("NVDA", candles);
  assert.ok(a.snapshot.sma50 !== null && a.snapshot.rsi14 !== null);
  assert.ok(a.observations.length >= 4);
  assert.equal(a.points.length, candles.length);
  for (const o of a.observations) assert.ok(o.method.length > 10 && o.text.length > 10);
  assert.ok(!a.observations.some((o) => /guarantee|you should (buy|sell)/i.test(o.text)));
});
await test("short histories do not crash and skip long-window indicators", () => {
  const a = analyze("X", generateMockCandles("X", FIXED, 30).slice(-30));
  assert.equal(a.snapshot.sma50, null);
});

console.log("Paper trading");
const mk = (side, quantity, price, t, symbol = "AAPL") => ({
  id: String(t), clientId: "c", symbol, side, quantity, price,
  dataSource: "mock", dataStatus: "mock", note: null, executedAt: `2026-01-0${t}T00:00:00Z`,
});
await test("average-cost ledger: cash, realized and open position", () => {
  const trades = [mk("buy", 10, 100, 1), mk("sell", 4, 110, 2)];
  const l = pf.computeLedger(trades);
  assert.equal(Math.round(l.cash * 100) / 100, 100000 - 1000 + 440);
  assert.equal(Math.round(l.realized * 100) / 100, 40);
  assert.deepEqual(l.holdings.get("AAPL"), { quantity: 6, cost: 600 });
});
await test("orders that exceed cash or holdings are rejected with clear messages", () => {
  const trades = [mk("buy", 10, 100, 1)];
  assert.match(pf.validateTrade(trades, "sell", "AAPL", 11, 100), /cannot sell/);
  assert.match(pf.validateTrade(trades, "sell", "MSFT", 1, 100), /nothing to sell/);
  assert.match(pf.validateTrade(trades, "buy", "AAPL", 10000, 100), /Not enough hypothetical cash/);
  assert.equal(pf.validateTrade(trades, "sell", "AAPL", 10, 100), null);
});
await test("portfolio totals reconcile and missing prices are flagged", () => {
  const trades = [mk("buy", 10, 100, 1), mk("buy", 5, 50, 2, "MSFT")];
  const s = pf.buildPortfolio(trades, { AAPL: { price: 120, status: "live" } });
  assert.equal(s.positions.find((p) => p.symbol === "AAPL").unrealizedPnl, 200);
  assert.equal(s.positions.find((p) => p.symbol === "MSFT").priceStatus, "unavailable");
  assert.equal(s.totalValue, s.cash + s.positionsValue);
});

console.log("AI explanation");
const series = await market.getSeries("AAPL");
const analysis = analyze("AAPL", series.candles);
await test("without an AI key a labeled rule-based fallback is returned", async () => {
  const e = await explain(series, analysis, "overview");
  assert.equal(e.mode, "fallback");
  assert.match(e.text, /not predictions or financial advice/);
  assert.ok(e.inputsUsed.length >= 5);
});
const realFetch = globalThis.fetch;
await test("a good AI answer is used and carries the disclaimer", async () => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://api.anthropic.com/v1/messages");
    assert.equal(init.headers["x-api-key"], "test-key");
    return new Response(JSON.stringify({ content: [{ type: "text", text: "The price sits above its 50-day average and RSI is mid-range." }] }), { status: 200 });
  };
  const e = await explain(series, analysis, "trend");
  assert.equal(e.mode, "ai");
  assert.match(e.text, /not predictions or financial advice/);
});
await test("advice-like or guaranteed-outcome AI text is replaced by the fallback", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ content: [{ type: "text", text: "You should buy now. This is guaranteed to rise." }] }), { status: 200 });
  const e = await explain(series, analysis, "overview");
  assert.equal(e.mode, "fallback");
  assert.ok(e.warning);
});
await test("provider failures degrade to the fallback without leaking details", async () => {
  globalThis.fetch = async () => new Response("boom", { status: 500 });
  const e = await explain(series, analysis, "overview");
  assert.equal(e.mode, "fallback");
  assert.ok(!JSON.stringify(e).includes("test-key"));
});
globalThis.fetch = realFetch;
delete process.env.ANTHROPIC_API_KEY;

console.log("Safety and storage");
await test("rate limiter blocks the request after the limit", () => {
  const req = new Request("http://x/", { headers: { "x-forwarded-for": "9.9.9.9" } });
  rateLimit(req, "t", 3); rateLimit(req, "t", 3); rateLimit(req, "t", 3);
  assert.throws(() => rateLimit(req, "t", 3), (e) => e instanceof HttpError && e.status === 429);
});
await test("in-memory store adds, lists and resets per client", async () => {
  const store = getStore();
  assert.equal(store.mode, "memory");
  const base = { symbol: "AAPL", side: "buy", quantity: 1, price: 100, dataSource: "mock", dataStatus: "mock", note: null };
  await store.add({ ...base, clientId: "a" });
  await store.add({ ...base, clientId: "b" });
  assert.equal((await store.list("a")).length, 1);
  await store.reset("a");
  assert.equal((await store.list("a")).length, 0);
  assert.equal((await store.list("b")).length, 1);
});

console.log(`\n${passed} checks passed${process.exitCode ? ", some FAILED" : ""}.`);
