import { handleError, ok, readJson, requireClientId } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { getSeries } from "@/lib/market";
import { getStore } from "@/lib/store";
import { MAX_TRADES_PER_CLIENT, validateTrade } from "@/lib/portfolio";
import { tradeInputSchema } from "@/lib/validation";
import { HttpError } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    rateLimit(req, "trade", 30);
    const clientId = requireClientId(req);
    const input = tradeInputSchema.parse(await readJson(req));

    const store = getStore();
    const trades = await store.list(clientId);
    if (trades.length >= MAX_TRADES_PER_CLIENT) {
      throw new HttpError(400, "trade_limit", `You have reached the demo limit of ${MAX_TRADES_PER_CLIENT} trades. Reset the portfolio to continue.`);
    }

    // The fill price is chosen by the server from the last available close, never by the browser.
    const series = await getSeries(input.symbol);
    const price = series.candles[series.candles.length - 1].close;

    const problem = validateTrade(trades, input.side, input.symbol, input.quantity, price);
    if (problem) throw new HttpError(400, "trade_rejected", problem);

    const trade = await store.add({
      clientId,
      symbol: input.symbol,
      side: input.side,
      quantity: input.quantity,
      price,
      dataSource: series.source,
      dataStatus: series.status,
      note: input.note ? input.note : null,
    });
    return ok({ trade }, 201);
  } catch (e) {
    return handleError(e);
  }
}
