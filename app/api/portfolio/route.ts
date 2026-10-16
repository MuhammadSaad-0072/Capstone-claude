import { handleError, ok, requireClientId } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { getSeries } from "@/lib/market";
import { getStore } from "@/lib/store";
import { buildPortfolio } from "@/lib/portfolio";
import type { PriceMap } from "@/lib/portfolio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    rateLimit(req, "portfolio", 60);
    const clientId = requireClientId(req);
    const store = getStore();
    const trades = await store.list(clientId);

    const symbols = Array.from(new Set(trades.map((t) => t.symbol)));
    const prices: PriceMap = {};
    await Promise.all(
      symbols.map(async (s) => {
        try {
          const series = await getSeries(s);
          prices[s] = { price: series.candles[series.candles.length - 1].close, status: series.status };
        } catch {
          prices[s] = undefined;
        }
      }),
    );

    return ok({
      summary: buildPortfolio(trades, prices),
      trades: [...trades].reverse(),
      storage: store.mode,
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    rateLimit(req, "portfolio-reset", 10);
    await getStore().reset(requireClientId(req));
    return ok({ reset: true });
  } catch (e) {
    return handleError(e);
  }
}
