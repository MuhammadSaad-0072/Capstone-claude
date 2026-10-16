import { handleError, ok, parseSymbol } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { getSeries } from "@/lib/market";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { symbol: string } }) {
  try {
    rateLimit(req, "market", 60);
    const series = await getSeries(parseSymbol(params.symbol));
    return ok({ series });
  } catch (e) {
    return handleError(e);
  }
}
