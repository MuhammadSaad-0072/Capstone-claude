import type { Metadata } from "next";
import Link from "next/link";
import { DEFS } from "@/components/Term";

export const metadata: Metadata = { title: "Learn the terms | Paper Tape" };

const TERMS: { name: string; key: keyof typeof DEFS }[] = [
  { name: "Closing price", key: "Close" },
  { name: "Candle (daily price bar)", key: "Candle" },
  { name: "Simple moving average (SMA)", key: "SMA" },
  { name: "Exponential moving average (EMA)", key: "EMA" },
  { name: "Relative Strength Index (RSI)", key: "RSI" },
  { name: "Volatility", key: "Volatility" },
  { name: "Paper trading", key: "PaperTrading" },
  { name: "Average cost", key: "AverageCost" },
  { name: "Unrealized profit or loss", key: "Unrealized" },
  { name: "Realized profit or loss", key: "Realized" },
  { name: "Stale data", key: "Stale" },
];

export default function LearnPage() {
  return (
    <div className="max-w-prose space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl">Learn the terms</h1>
        <p className="text-sm text-muted">Plain-language meanings for the words you will see in Paper Tape.</p>
      </header>

      <section aria-labelledby="terms-title">
        <h2 id="terms-title" className="sr-only">
          Glossary
        </h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {TERMS.map((t) => (
            <div key={t.key} className="py-3">
              <dt className="font-medium">{t.name}</dt>
              <dd className="mt-1 text-sm">{DEFS[t.key]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="limits-title" className="space-y-2">
        <h2 id="limits-title" className="text-lg">
          What this app does and does not do
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>It shows market data, calculates a few well-known indicators and explains them in plain language.</li>
          <li>It lets you practise with pretend money and keeps a record of your hypothetical trades.</li>
          <li>It does not place real orders, connect to a broker or hold real money.</li>
          <li>It cannot predict prices or promise returns. Indicators describe the past and are often wrong about what comes next.</li>
          <li>When prices are simulated or out of date, the app says so next to the data.</li>
        </ul>
        <p className="text-sm">
          Ready to practise? Head to the{" "}
          <Link href="/" className="underline">
            dashboard
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
