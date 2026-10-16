"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "@/lib/client";
import { fmtUsd } from "@/lib/format";
import type { DataStatus, Side, Trade } from "@/lib/types";
import Term from "./Term";

interface Props {
  symbol: string;
  price: number;
  status: DataStatus;
}

export default function TradeForm({ symbol, price, status }: Props) {
  const [side, setSide] = useState<Side>("buy");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const q = Number(qty);
  const valid = qty.trim() !== "" && Number.isFinite(q) && q > 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setMsg(null);
    try {
      const { trade } = await api<{ trade: Trade }>("/api/portfolio/trades", {
        method: "POST",
        body: JSON.stringify({ symbol, side, quantity: q, note: note.trim() || undefined }),
      });
      setMsg({
        kind: "ok",
        text: `Recorded a hypothetical ${trade.side} of ${trade.quantity} ${trade.symbol} at ${fmtUsd(trade.price)}.`,
      });
      setNote("");
    } catch (err) {
      setMsg({ kind: "error", text: err instanceof Error ? err.message : "Could not record the trade." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="trade-title">
      <h2 id="trade-title" className="text-lg">
        Practise a <Term k="PaperTrading">paper trade</Term>
      </h2>
      <p className="mt-1 max-w-prose text-sm text-muted">
        Orders fill at the last available close, {fmtUsd(price)}
        {status === "mock" ? " (simulated demo price)" : status === "stale" ? " (stale price)" : ""}. Nothing is sent to a broker.
      </p>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <fieldset>
          <legend className="text-xs text-muted">Side</legend>
          <div className="mt-1 flex gap-4 text-sm">
            {(["buy", "sell"] as Side[]).map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="side" value={s} checked={side === s} onChange={() => setSide(s)} />
                {s === "buy" ? "Buy" : "Sell"}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="qty" className="block text-xs text-muted">
            Shares (up to 4 decimals)
          </label>
          <input id="qty" inputMode="decimal" className="field mt-1 max-w-[10rem]" value={qty} onChange={(e) => setQty(e.target.value)} aria-invalid={!valid} />
          {!valid && <p className="mt-1 text-xs text-loss">Enter a number greater than zero.</p>}
        </div>
        <div>
          <label htmlFor="note" className="block text-xs text-muted">
            Why are you making this trade? (optional, 140 characters)
          </label>
          <input id="note" className="field mt-1" maxLength={140} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <p className="num text-sm">
          Estimated {side === "buy" ? "cost" : "proceeds"}: <strong>{valid ? fmtUsd(q * price) : "n/a"}</strong>
        </p>
        <button type="submit" className="btn btn-primary" disabled={busy || !valid}>
          {busy ? "Recording..." : `Record paper ${side}`}
        </button>
      </form>
      <div aria-live="polite" className="mt-3">
        {msg?.kind === "ok" && (
          <p className="text-sm text-gain">
            {msg.text}{" "}
            <Link href="/portfolio" className="underline">
              View your portfolio
            </Link>
          </p>
        )}
        {msg?.kind === "error" && (
          <p role="alert" className="text-sm text-loss">
            {msg.text}
          </p>
        )}
      </div>
    </section>
  );
}
