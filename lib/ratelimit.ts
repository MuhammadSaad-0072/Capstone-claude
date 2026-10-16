import { HttpError } from "./errors";

const g = globalThis as unknown as { __rl?: Map<string, number[]> };
const buckets = g.__rl ?? new Map<string, number[]>();
g.__rl = buckets;

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64);
  return req.headers.get("x-real-ip")?.slice(0, 64) ?? "unknown";
}

/**
 * Best-effort sliding-window limiter. On serverless platforms each instance keeps its own counters,
 * so this blunts bursts and accidental loops but is not a hard global limit.
 */
export function rateLimit(req: Request, name: string, limit: number, windowMs = 60000): void {
  const now = Date.now();
  const key = `${name}:${clientIp(req)}`;
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    throw new HttpError(429, "rate_limited", "Too many requests. Please wait a minute and try again.");
  }
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets.entries()) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
}
