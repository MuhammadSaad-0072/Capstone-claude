import { handleError, ok, parseSymbol } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { getSeries } from "@/lib/market";
import { analyze } from "@/lib/analysis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { symbol: string } }) {
  try {
    rateLimit(req, "analysis", 60);
    const symbol = parseSymbol(params.symbol);
    const series = await getSeries(symbol);
    const analysis = analyze(symbol, series.candles);
    return ok({ series, analysis });
  } catch (e) {
    return handleError(e);
  }
}
