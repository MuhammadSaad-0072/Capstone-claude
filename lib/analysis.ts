import type { Analysis, AnalysisSeriesPoint, Candle, IndicatorSnapshot, Observation } from "./types";
import { annualizedVolatility, ema, mean, pctChange, rsi, sma } from "./indicators";

const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const usd = (n: number) => `$${n.toFixed(2)}`;

export function analyze(symbol: string, candles: Candle[]): Analysis {
  const closes = candles.map((c) => c.close);
  const s20 = sma(closes, 20);
  const s50 = sma(closes, 50);
  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);
  const rs = rsi(closes, 14);
  const i = closes.length - 1;
  const lastClose = closes[i];

  const snapshot: IndicatorSnapshot = {
    lastClose: r(lastClose),
    sma20: s20[i] === null ? null : r(s20[i] as number),
    sma50: s50[i] === null ? null : r(s50[i] as number),
    ema12: e12[i] === null ? null : r(e12[i] as number),
    ema26: e26[i] === null ? null : r(e26[i] as number),
    rsi14: rs[i] === null ? null : r(rs[i] as number, 1),
    change20d: (() => {
      const c = pctChange(closes, 20);
      return c === null ? null : r(c);
    })(),
    volatility20d: (() => {
      const v = annualizedVolatility(closes, 20);
      return v === null ? null : r(v, 1);
    })(),
    periodHigh: r(Math.max(...candles.map((c) => c.high))),
    periodLow: r(Math.min(...candles.map((c) => c.low))),
    avgVolume20: candles.length >= 20 ? Math.round(mean(candles.slice(-20).map((c) => c.volume))) : null,
  };

  const points: AnalysisSeriesPoint[] = candles.map((c, idx) => ({
    date: c.date,
    close: r(c.close),
    sma20: s20[idx] === null ? null : r(s20[idx] as number),
    sma50: s50[idx] === null ? null : r(s50[idx] as number),
    rsi14: rs[idx] === null ? null : r(rs[idx] as number, 1),
  }));

  const observations: Observation[] = [];

  if (snapshot.sma50 !== null) {
    const diff = (lastClose / snapshot.sma50 - 1) * 100;
    const above = diff >= 0;
    observations.push({
      id: "trend-sma50",
      title: above ? "Price is above its 50-day average" : "Price is below its 50-day average",
      text: `The latest close (${usd(lastClose)}) is ${Math.abs(diff).toFixed(1)}% ${above ? "above" : "below"} the 50-day simple moving average (${usd(snapshot.sma50)}). Learners often read this as a description of the recent trend, but it only reflects past prices.`,
      method: "Simple moving average (SMA): the average of the last 50 daily closing prices, compared with the latest close.",
      values: { "Latest close": r(lastClose), "SMA 50": snapshot.sma50, "Difference %": r(diff) },
      tone: "info",
    });
  }

  const a = s20[i];
  const b = s50[i];
  if (a !== null && b !== null) {
    const gap = a - b;
    let crossed = false;
    for (let j = i - 1; j >= Math.max(i - 10, 0); j--) {
      const ja = s20[j];
      const jb = s50[j];
      if (ja !== null && jb !== null && Math.sign(ja - jb) !== Math.sign(gap) && gap !== 0) {
        crossed = true;
        break;
      }
    }
    observations.push({
      id: "trend-cross",
      title: crossed
        ? `The 20-day average recently crossed ${gap > 0 ? "above" : "below"} the 50-day average`
        : `The 20-day average is ${gap >= 0 ? "above" : "below"} the 50-day average`,
      text: crossed
        ? `Within the last 10 sessions the 20-day average moved ${gap > 0 ? "above" : "below"} the 50-day average. Crossovers are a common teaching example, and they often lag the price and can reverse.`
        : `The 20-day average (${usd(a)}) sits ${Math.abs((gap / b) * 100).toFixed(1)}% ${gap >= 0 ? "above" : "below"} the 50-day average (${usd(b)}). It has not crossed in the last 10 sessions.`,
      method: "Compares the 20-day SMA with the 50-day SMA and checks whether their order changed in the last 10 sessions.",
      values: { "SMA 20": r(a), "SMA 50": r(b), "Gap %": r((gap / b) * 100) },
      tone: "info",
    });
  }

  if (snapshot.rsi14 !== null) {
    const v = snapshot.rsi14;
    const zone = v >= 70 ? "upper zone" : v <= 30 ? "lower zone" : "middle range";
    observations.push({
      id: "momentum-rsi",
      title: `RSI(14) is ${v.toFixed(1)}, in the ${zone}`,
      text: `The Relative Strength Index compares recent gains with recent losses on a 0 to 100 scale. Readings above 70 are commonly called overbought and below 30 oversold. Strong moves can stay in those zones for a long time, so treat it as context, not a signal.`,
      method: "RSI with a 14-day period using Wilder's smoothing of average gains and average losses.",
      values: { "RSI 14": v },
      tone: v >= 70 || v <= 30 ? "caution" : "neutral",
    });
  }

  if (snapshot.change20d !== null) {
    const c = snapshot.change20d;
    observations.push({
      id: "momentum-change",
      title: `Price changed ${c >= 0 ? "+" : ""}${c.toFixed(1)}% over 20 sessions`,
      text: `Compared with 20 trading sessions ago, the close is ${c >= 0 ? "higher" : "lower"} by ${Math.abs(c).toFixed(1)}%. Past changes do not predict what comes next.`,
      method: "Latest close divided by the close 20 sessions earlier, minus 1.",
      values: { "20-day change %": c },
      tone: "neutral",
    });
  }

  if (snapshot.volatility20d !== null) {
    const v = snapshot.volatility20d;
    observations.push({
      id: "risk-volatility",
      title: `Recent volatility is about ${v.toFixed(0)}% a year`,
      text: `Over the last 20 sessions, daily moves have typically been around ${(v / Math.sqrt(252)).toFixed(1)}%. Higher volatility means prices have been swinging more, which raises the chance of larger gains and larger losses.`,
      method: "Standard deviation of the last 20 daily returns, scaled by the square root of 252 trading days.",
      values: { "Annualized volatility %": v },
      tone: v >= 40 ? "caution" : "neutral",
    });
  }

  return { symbol, asOfDate: candles[i].date, snapshot, points, observations };
}
