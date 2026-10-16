import { ok } from "@/lib/http";
import { marketMode } from "@/lib/market";
import { aiConfigured } from "@/lib/explain";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return ok({
    status: "ok",
    market: marketMode(),
    ai: aiConfigured() ? "configured" : "fallback",
    storage: getStore().mode,
    time: new Date().toISOString(),
  });
}
