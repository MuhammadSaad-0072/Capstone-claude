import { handleError, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { getSeries } from "@/lib/market";
import { analyze } from "@/lib/analysis";
import { explain } from "@/lib/explain";
import { explainInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    rateLimit(req, "explain", 8);
    const body = explainInputSchema.parse(await readJson(req));
    // The server recomputes everything itself. It never trusts figures sent by the browser.
    const series = await getSeries(body.symbol);
    const analysis = analyze(body.symbol, series.candles);
    return ok(await explain(series, analysis, body.focus));
  } catch (e) {
    return handleError(e);
  }
}
