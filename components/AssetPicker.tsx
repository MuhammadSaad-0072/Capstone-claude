"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import type { Asset } from "@/lib/types";
import { ErrorBox, Skeleton } from "./States";

export default function AssetPicker({ selected, onSelect }: { selected: string; onSelect: (s: string) => void }) {
  const { data, error, loading, reload } = useApi<{ assets: Asset[] }>("/api/assets");
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const list = (data?.assets ?? []).filter((a) => !needle || a.symbol.toLowerCase().includes(needle) || a.name.toLowerCase().includes(needle));

  return (
    <section aria-labelledby="pick-title">
      <h2 id="pick-title" className="text-lg">
        Choose an asset
      </h2>
      <label htmlFor="asset-search" className="sr-only">
        Search by name or symbol
      </label>
      <input
        id="asset-search"
        className="field mt-2"
        placeholder="Search name or symbol"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
      />
      {loading && (
        <div className="mt-3 space-y-2" role="status">
          <span className="sr-only">Loading assets</span>
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      )}
      {error && (
        <div className="mt-3">
          <ErrorBox message={error} onRetry={reload} />
        </div>
      )}
      {data && list.length === 0 && <p className="mt-3 text-sm text-muted">No match. Try a company name such as Apple, or a symbol such as SPY.</p>}
      {data && list.length > 0 && (
        <ul className="mt-2 max-h-80 divide-y divide-rule overflow-y-auto border-y border-rule">
          {list.map((a) => (
            <li key={a.symbol}>
              <button
                type="button"
                aria-pressed={a.symbol === selected}
                onClick={() => onSelect(a.symbol)}
                className={`flex w-full items-baseline justify-between px-2 py-2 text-left text-sm hover:bg-rule/50 ${a.symbol === selected ? "bg-rule/70 font-medium" : ""}`}
              >
                <span className="num font-medium">{a.symbol}</span>
                <span className="ml-3 truncate text-xs text-muted">{a.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
