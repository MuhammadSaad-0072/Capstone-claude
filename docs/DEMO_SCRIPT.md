# Capstone Presentation Support

## 1. Two-minute explanation
**Problem.** Beginners meet market data scattered across tools, wrapped in jargon, and often shown with false confidence.
**Users.** Students and beginner traders first, and educators or evaluators second.
**Solution.** Paper Tape puts data, transparent indicators, plain-language explanations and a risk-free practice portfolio in one place, and labels every figure with its source and freshness.
**Technical choices.** Next.js and TypeScript for UI and API, Alpha Vantage behind an adapter with a simulator fallback, Anthropic's API called only on the server with a rule-based fallback, Supabase Postgres for the portfolio, Vercel for hosting. Each external service is optional, so the demo never depends on a key.
**Boundaries.** No real trades, no brokers, no predictions, no guarantees.

## 2. Feature-by-feature demo (about 8 minutes)
1. **Honesty banner and status.** Point to the banner and the status line (prices, explanations, storage). Open `/api/health` to show the same facts.
2. **Dashboard.** Select AAPL, then search "spy". Show price, day change, the data badge (source, latest close, fetched time) and the warning if data is simulated.
3. **Chart.** Switch ranges. Open "View the latest values as a table" to show the accessible alternative.
4. **Statistics and indicators.** Read one observation, then open "How this is calculated" to show the method and values. Hover a dotted term to show its definition.
5. **RSI chart.** Explain the 30 and 70 lines and why they are context, not signals.
6. **AI explanation.** Press *Explain this data* with focus *Risk*. Show the label (AI or rule-based), the inputs used and the disclaimer. If no key is set, say this is the designed fallback and show it.
7. **Paper trade.** Buy 10 shares. Try selling 50 to show the clear rejection message.
8. **Portfolio.** Show cash, positions, average cost, unrealized P/L and history. Point out the price-data labels. Reset the portfolio to show the confirmation.
9. **Failure handling.** Select a symbol, then unset the market key (or use demo mode) and reload to show the labelled fallback. Show the error box and retry on a blocked network if you can.
10. **Learn page.** Show the glossary and the "does and does not do" list.

## 3. Likely evaluator questions
**Does it give financial advice or predict prices?** No. It describes past prices, labels everything as informational and uncertain, and rejects AI output that sounds like advice or certainty.

**Can it place real trades?** No. There is no broker integration anywhere. Trades are rows in a table.

**Where do prices come from?** Alpha Vantage end-of-day data when a key is set, otherwise a built-in simulator. The source and fetch time are shown on every view, and simulated data is labelled "Demo data".

**What if the AI is down?** The app shows a labelled rule-based summary built from the same calculations.

**How do you stop the AI from making things up?** It only receives figures the server computed, the prompt forbids invented facts, the user cannot send free text, and a guard rejects advice-like output. It can still be imperfect, which is why the inputs used are shown beside every answer.

**How are secrets protected?** Server environment variables only, never exposed to the browser, never logged.

**Why no login?** To keep the capstone achievable. A random id per browser separates portfolios. The tradeoff is that clearing browser data starts a new portfolio, and Supabase Auth is the next step.

**What are the weakest points?** The free-tier data quota, best-effort rate limiting on serverless, and the lack of accounts. These are listed in the README with proposed fixes.

**What did you actually verify?** The logic is covered by 21 offline checks (`npm run verify`). Run `npm run build` and the walkthrough above before presenting, because the UI and live services were not exercised in the build environment.
