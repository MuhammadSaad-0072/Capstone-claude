# Paper Tape: AI Agent for Trading (educational capstone)

Paper Tape helps beginners learn how to read market data. It shows prices and a few well-known indicators, explains them in plain language (with AI when available), and lets users practise with a **paper-trading portfolio**.

> **Education only.** The app never places real trades, never connects to a brokerage and never promises returns. All signals are labelled as informational and uncertain.

## What is inside

| Area | What it does |
|---|---|
| Dashboard (`/`) | Asset search, latest price, price chart with 20/50-day averages, statistics, source and last-updated label |
| Analysis | SMA, EMA, RSI(14), 20-day change, volatility. Each observation shows its method and values |
| AI explanation | Server-side call to the Anthropic Messages API, with listed inputs, an output guard, and a rule-based fallback |
| Paper portfolio (`/portfolio`) | Hypothetical buys and sells, positions, average cost, realized and unrealized P/L, history, reset |
| Learn (`/learn`) | Glossary and a plain statement of what the app does and does not do |

Every external service is optional. With **no keys at all** the app runs on clearly labelled demo data, temporary in-memory storage and a rule-based explanation, so it can always be demonstrated.

## Quick start (no accounts needed)

```bash
npm install
npm run dev          # http://localhost:3000
```

Useful checks:

```bash
npm run verify       # 21 offline logic checks (Node 22.6+)
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run build        # production build
```

## Turning on the real services

Copy `.env.example` to `.env.local` and fill in what you have. All variables are server-side only.

| Variable | Purpose | Without it |
|---|---|---|
| `ALPHAVANTAGE_API_KEY` | Real end-of-day prices (free key: https://www.alphavantage.co/support/#api-key) | Demo data, labelled "Demo data (simulated)" |
| `MARKET_DATA_PROVIDER` | `auto` (default) or `mock` to force demo data | `auto` |
| `MARKET_CACHE_TTL_SECONDS` | How long fetched prices are reused (default 21600) | 6 hours |
| `ANTHROPIC_API_KEY` | AI-written explanations | Rule-based explanation, labelled "no AI" |
| `ANTHROPIC_MODEL` | Model name (default `claude-sonnet-5-5`) | Default |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Persistent paper portfolio | Temporary memory storage, with a visible warning |

### Database setup (Supabase)

1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it once.
3. Copy the project URL and the **service_role** key into your environment variables. Never expose the service_role key in browser code or commit it.

## Deploy on Vercel

1. Put this folder in a GitHub repository (the folder itself is the project root).
2. In Vercel choose **Add New > Project**, import the repository. The Next.js preset is detected automatically.
3. Under **Environment Variables** add any variables from the table above.
4. Deploy. Open `/api/health` on your deployment to confirm which services are active (`market`, `ai`, `storage`).

Or from a terminal: `npm i -g vercel && vercel` then `vercel --prod`.

## Verification status (please read)

Verified in the build environment: all pure logic, by running `npm run verify`. That covers 21 checks across indicators, deterministic demo data, Alpha Vantage response parsing and error payloads, analysis, paper-trading rules and totals, AI success, guard and failure paths, rate limiting and the in-memory store.

Also checked: the files in `lib/` pass the TypeScript compiler in strict mode, using stand-in type declarations for packages that could not be installed (the only two messages came from those stand-ins).

**Not verified there:** `npm install`, `next build`, type-checking of `app/` and `components/`, ESLint, and running the UI in a browser. The build environment had no network access, so dependencies could not be installed. Live Alpha Vantage, Anthropic and Supabase calls were also not exercised. Before presenting, run the checks above once on your machine or in Vercel's build logs, then walk through `docs/DEMO_SCRIPT.md`. If a type error appears, it will name the file and line.

## Known limitations

- **No accounts.** A portfolio belongs to an anonymous id stored in the browser (`localStorage`). Clearing browser data or switching browsers starts a new portfolio.
- **Rate limiting is best-effort.** Counters live in each serverless instance, so they blunt bursts but are not a global limit.
- **Free-tier quotas.** The Alpha Vantage free tier is small, so results are cached. Verify current limits on the provider's site.
- **End-of-day data only.** Fills use the last available close, with no intraday prices, fees, slippage or order types.
- **Simultaneous trades** from two tabs in the same instant could slightly overspend hypothetical cash. The cost is pretend money, and a transactional function would remove it.
- Only 20 listed US stocks and ETFs are supported, which keeps input safe and quota use low.

## Future improvements

Supabase Auth for per-user portfolios, a database-backed rate limiter, more indicators (MACD, Bollinger Bands), watchlists, price-history export, and automated browser tests.

## Project structure

```
app/            Pages (/, /portfolio, /learn) and API routes (app/api/*)
components/     UI components
lib/            Business logic: indicators, analysis, market adapter, portfolio rules,
                AI explanation, storage, validation, rate limiting, logging
supabase/       schema.sql
scripts/        verify.mjs (offline checks)
docs/           Proposal, technical research, system design, API, demo script
```
