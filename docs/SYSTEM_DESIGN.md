# System Design

## Architecture

```
Browser (Next.js pages, React)
   |  fetch + x-client-id header
   v
Next.js route handlers (Node runtime on Vercel)
   |-- validation (Zod) and rate limiting
   |-- market adapter ---> Alpha Vantage (or built-in simulator), with cache
   |-- analysis (indicators, observations)
   |-- explanation service ---> Anthropic Messages API (or rule-based fallback)
   '-- trade store ---> Supabase PostgreSQL (or in-memory fallback)
```

Layers in `lib/`: external clients (`market.ts`, `explain.ts`, `store.ts`), business logic (`indicators.ts`, `analysis.ts`, `portfolio.ts`), and shared plumbing (`http.ts`, `validation.ts`, `ratelimit.ts`, `logger.ts`). The UI never talks to a third party directly.

## Data flow
1. The dashboard calls `GET /api/analysis/{symbol}`. The server loads candles (cache, then provider, then fallback), computes indicators and returns both.
2. **Explain** posts `{symbol, focus}`. The server recomputes the analysis, calls the LLM (or builds the fallback) and returns text plus the inputs used.
3. **Trade** posts `{symbol, side, quantity}`. The server loads the client's trades, takes the latest close as the fill price, validates cash or holdings, and inserts a row.
4. **Portfolio** reads the trades, fetches the last close for each held symbol (cached) and rebuilds positions with average-cost accounting.

External APIs are called only when the cache is empty or expired (market data) and when the user presses *Explain this data* (AI).

## Database schema

`paper_trades`

| Column | Type | Purpose |
|---|---|---|
| id | uuid, primary key | Trade id |
| client_id | uuid | Anonymous browser portfolio id |
| symbol | text, `^[A-Z.]{1,10}$` | Asset |
| side | text, `buy` or `sell` | Direction |
| quantity | numeric(18,6), > 0 | Shares |
| price | numeric(18,4), > 0 | Fill price (last close) |
| data_source | text | `alphavantage` or `mock` |
| data_status | text | `live`, `cached`, `stale`, `mock` |
| note | text, up to 140 chars | Optional learner note |
| executed_at | timestamptz | Time recorded |

Index on `(client_id, executed_at)`. Row-level security is enabled with no policies. Supported assets are a static list in code, and no users table exists because accounts are out of scope. Cash and positions are always derived from the trade history, so there is no balance to corrupt.

## Accounting rules
Starting cash is $100,000 of hypothetical money. Buys reduce cash and raise cost basis. Sells use the average cost: realized P/L is `(sell price - average cost) x shares`. Unrealized P/L is `market value - remaining cost`. Fees and slippage are not modelled.

## Security and failure handling

| Situation | Behaviour |
|---|---|
| No market key | Simulated data, labelled everywhere |
| Provider error or quota | Cached data labelled *stale*, otherwise simulated data with a warning |
| Data older than 7 days | Labelled *stale* |
| No AI key, timeout, error or unsafe output | Rule-based summary, labelled "no AI" |
| No database configured | In-memory storage with a visible warning |
| Database error | HTTP 503 with a friendly message, details logged without secrets |
| Invalid input | HTTP 400 with a readable message |
| Too many requests | HTTP 429 |
| Unknown error | HTTP 500 with a generic message, no stack trace |

Logging is structured JSON, redacts sensitive keys and never records request bodies or API keys.
