import { ok, handleError } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { searchAssets } from "@/lib/assets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    rateLimit(req, "assets", 60);
    const q = new URL(req.url).searchParams.get("q") ?? "";
    return ok({ assets: searchAssets(q.slice(0, 40)) });
  } catch (e) {
    return handleError(e);
  }
}
