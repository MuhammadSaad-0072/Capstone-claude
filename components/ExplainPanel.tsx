"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { ExplainFocus, Explanation } from "@/lib/types";
import { ErrorBox } from "./States";

interface State {
  loading: boolean;
  error: string | null;
  result: Explanation | null;
}

const FOCUS: { value: ExplainFocus; label: string }[] = [
  { value: "overview", label: "Overall picture" },
  { value: "trend", label: "Trend" },
  { value: "momentum", label: "Momentum" },
  { value: "risk", label: "Risk and volatility" },
];

export default function ExplainPanel({ symbol }: { symbol: string }) {
  const [focus, setFocus] = useState<ExplainFocus>("overview");
  const [state, setState] = useState<State>({ loading: false, error: null, result: null });

  useEffect(() => {
    setState({ loading: false, error: null, result: null });
  }, [symbol]);

  async function run() {
    setState({ loading: true, error: null, result: null });
    try {
      const result = await api<Explanation>("/api/explain", { method: "POST", body: JSON.stringify({ symbol, focus }) });
      setState({ loading: false, error: null, result });
    } catch (e) {
      setState({ loading: false, error: e instanceof Error ? e.message : "Unexpected error.", result: null });
    }
  }

  const { loading, error, result } = state;

  return (
    <section aria-labelledby="explain-title">
      <h2 id="explain-title" className="text-lg">
        Explain it in plain language
      </h2>
      <p className="mt-1 max-w-prose text-sm text-muted">
        Get a short summary of the figures above. It lists the inputs it used, and it will not give advice or predictions.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="focus" className="block text-xs text-muted">
            Focus on
          </label>
          <select id="focus" className="field mt-1 w-auto" value={focus} onChange={(e) => setFocus(e.target.value as ExplainFocus)}>
            {FOCUS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? "Writing..." : "Explain this data"}
        </button>
      </div>

      <div aria-live="polite" className="mt-4">
        {error && <ErrorBox message={error} onRetry={run} />}
        {result && (
          <div className="space-y-3 border-l-2 border-ink bg-panel px-4 py-3">
            <p className="text-xs font-medium text-muted">
              {result.mode === "ai" ? `Written by AI (${result.model ?? "model"})` : "Rule-based summary (no AI)"}
            </p>
            {result.warning && <p className="text-xs text-caution">{result.warning}</p>}
            {result.text.split("\n\n").map((para, i) => (
              <p key={i} className="max-w-prose text-sm">
                {para}
              </p>
            ))}
            <details className="text-sm">
              <summary className="cursor-pointer text-muted">Inputs used</summary>
              <dl className="mt-2 grid max-w-lg grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                {result.inputsUsed.map((i) => (
                  <div key={i.label} className="contents">
                    <dt className="text-muted">{i.label}</dt>
                    <dd className="num">{i.value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>
        )}
      </div>
    </section>
  );
}
