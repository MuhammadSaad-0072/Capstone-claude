"use client";

import { useApi } from "@/lib/useApi";

interface Health {
  market: "alphavantage" | "mock";
  ai: "configured" | "fallback";
  storage: "supabase" | "memory";
}

export default function SystemStatus() {
  const { data, error, loading } = useApi<Health>("/api/health");
  if (loading) return <p className="text-xs text-muted">Checking services...</p>;
  if (error || !data) return <p className="text-xs text-caution">Service status unavailable.</p>;
  const items = [
    ["Prices", data.market === "alphavantage" ? "live API" : "demo data"],
    ["Explanations", data.ai === "configured" ? "AI" : "rule-based, no AI"],
    ["Portfolio storage", data.storage === "supabase" ? "database" : "temporary memory"],
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Service status">
      {items.map(([k, v]) => (
        <li key={k}>
          {k}: <span className="font-medium text-ink">{v}</span>
        </li>
      ))}
    </ul>
  );
}
