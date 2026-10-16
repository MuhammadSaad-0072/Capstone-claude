import type { DataStatus, PortfolioSummary, Position, Side, Trade } from "./types";

export const STARTING_CASH = 100000;
export const MAX_TRADES_PER_CLIENT = 500;
const EPS = 1e-9;

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Holding {
  quantity: number;
  cost: number;
}

/** Replays trades in time order using the average-cost method. */
export function computeLedger(trades: Trade[]) {
  const sorted = [...trades].sort((a, b) => a.executedAt.localeCompare(b.executedAt));
  let cash = STARTING_CASH;
  let realized = 0;
  const holdings = new Map<string, Holding>();

  for (const t of sorted) {
    const value = t.quantity * t.price;
    const h = holdings.get(t.symbol) ?? { quantity: 0, cost: 0 };
    if (t.side === "buy") {
      h.quantity += t.quantity;
      h.cost += value;
      cash -= value;
      holdings.set(t.symbol, h);
    } else {
      const avg = h.quantity > 0 ? h.cost / h.quantity : 0;
      realized += (t.price - avg) * t.quantity;
      h.cost -= avg * t.quantity;
      h.quantity -= t.quantity;
      cash += value;
      if (h.quantity <= EPS) holdings.delete(t.symbol);
      else holdings.set(t.symbol, h);
    }
  }
  return { cash, realized, holdings };
}

/** Returns a plain-language error message, or null when the order is allowed. */
export function validateTrade(trades: Trade[], side: Side, symbol: string, quantity: number, price: number): string | null {
  const { cash, holdings } = computeLedger(trades);
  const value = quantity * price;
  if (side === "buy") {
    if (value > cash + EPS) {
      return `Not enough hypothetical cash. This order costs ${money(value)} and you have ${money(cash)}.`;
    }
    return null;
  }
  const held = holdings.get(symbol)?.quantity ?? 0;
  if (quantity > held + EPS) {
    return held <= EPS
      ? `You do not hold any ${symbol}, so there is nothing to sell.`
      : `You hold ${round(held, 4)} shares of ${symbol}, so you cannot sell ${round(quantity, 4)}.`;
  }
  return null;
}

export type PriceMap = Record<string, { price: number; status: DataStatus } | undefined>;

export function buildPortfolio(trades: Trade[], prices: PriceMap): PortfolioSummary {
  const { cash, realized, holdings } = computeLedger(trades);
  const positions: Position[] = [];
  let positionsValue = 0;
  let unrealized = 0;

  for (const [symbol, h] of holdings.entries()) {
    const avgCost = h.cost / h.quantity;
    const p = prices[symbol];
    if (p) {
      const marketValue = h.quantity * p.price;
      const pnl = marketValue - h.cost;
      positionsValue += marketValue;
      unrealized += pnl;
      positions.push({
        symbol,
        quantity: round(h.quantity, 6),
        avgCost: round(avgCost, 4),
        lastPrice: round(p.price, 4),
        marketValue: round(marketValue),
        unrealizedPnl: round(pnl),
        unrealizedPct: h.cost > 0 ? round((pnl / h.cost) * 100) : null,
        priceStatus: p.status,
      });
    } else {
      // No price available: value the position at cost so totals stay sensible, and flag it.
      positionsValue += h.cost;
      positions.push({
        symbol,
        quantity: round(h.quantity, 6),
        avgCost: round(avgCost, 4),
        lastPrice: null,
        marketValue: null,
        unrealizedPnl: null,
        unrealizedPct: null,
        priceStatus: "unavailable",
      });
    }
  }
  positions.sort((a, b) => a.symbol.localeCompare(b.symbol));

  const totalValue = cash + positionsValue;
  return {
    startingCash: STARTING_CASH,
    cash: round(cash),
    positionsValue: round(positionsValue),
    totalValue: round(totalValue),
    realizedPnl: round(realized),
    unrealizedPnl: round(unrealized),
    totalReturnPct: round((totalValue / STARTING_CASH - 1) * 100),
    positions,
  };
}
