# Technical Research

## Honesty note on sources
During the build I could not open the providers' official pages (the search results were third-party summaries). Rate limits and pricing below are therefore **things to verify**, not facts to rely on. Official starting points are listed for each choice.

## Choices and reasons

| Area | Choice | Why | Official documentation |
|---|---|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript | One project for UI and API, first-class Vercel support, matches course material | https://nextjs.org/docs |
| Styling | Tailwind CSS | Fast, consistent, small CSS | https://tailwindcss.com/docs |
| Charts | Recharts | React-native charts, simple to make legible and add text alternatives | https://recharts.org |
| Backend | Next.js route handlers (Node runtime) | Keeps secrets server-side, no second service to deploy | https://nextjs.org/docs/app/building-your-application/routing/route-handlers |
| Validation | Zod | Typed, readable errors | https://zod.dev |
| Market data | Alpha Vantage `TIME_SERIES_DAILY` behind an adapter, plus a built-in simulator | Free key, daily history, simple JSON. The simulator keeps the demo working with no key | https://www.alphavantage.co/documentation/ |
| AI | Anthropic Messages API called server-side | Clear request shape, strong instruction following. The model is a variable so it can change without code edits | https://docs.claude.com/en/api/messages |
| Database | Supabase (PostgreSQL) | Hosted Postgres with a free tier, SQL editor for setup, covered in the course | https://supabase.com/docs |
| Hosting | Vercel (app and API) + Supabase (database) | Git-based deploys and environment-variable secrets | https://vercel.com/docs |

## Market data details
- **Data used:** daily open, high, low, close and volume (`outputsize=compact`, about 100 sessions).
- **Free-tier limits (verify):** third-party pages I found describe a small daily request cap (about 25 a day and 5 a minute), while an older third-party source cites 500 a day. Check the provider's own page before relying on any number.
- **How the app copes:** responses are cached (default 6 hours), simultaneous requests for one symbol share a single call, only 20 whitelisted symbols are accepted, and quota or error payloads (`Note`, `Information`, `Error Message`) are detected and turned into readable messages.
- **Stale or missing data:** a failed refresh serves the last cached data labelled *stale*. With nothing cached it serves simulated data labelled *demo*. A latest data point older than 7 days is also labelled *stale*.

## AI/LLM design
- **Role:** turn already-computed indicator values into a short plain-language summary.
- **Input boundary:** the server recomputes all figures itself and sends only symbol, data status, indicator values and observation values. The browser cannot supply numbers. The only user-controlled input is a fixed choice (`overview`, `trend`, `momentum`, `risk`), so there is no free text to inject.
- **Output boundary:** a system prompt forbids advice, predictions and invented facts. A server-side guard rejects text containing guarantee or advice patterns and switches to the rule-based summary. Output is length-limited and always followed by a disclaimer.
- **Privacy:** no personal data is sent, only public market figures. The key stays in a server environment variable.
- **Fallback:** missing key, timeout (20 seconds), provider error or guard rejection all produce a labelled rule-based summary.

## Database
PostgreSQL via Supabase, one table (`paper_trades`) with constraints, indexed by client and time, row-level security enabled with no public policies. The server uses the service role key. See `SYSTEM_DESIGN.md`.

## Security decisions
- **Authentication:** not in scope for this version. A random UUID per browser identifies a portfolio. This is simple but weak, because anyone with the id can use that portfolio. Only pretend data is at stake. Supabase Auth is the natural upgrade.
- **Input validation:** Zod on every body, symbols whitelisted, quantity limits and a 500-trade cap per portfolio.
- **Secrets:** environment variables only, never `NEXT_PUBLIC_`, never logged (the logger redacts sensitive keys and error text strips key-like query strings).
- **Trade integrity:** the server picks the fill price from market data. The browser cannot send a price.
- **Abuse prevention:** best-effort per-IP rate limits (8 per minute for AI, 30 for trades, 60 for reads). Security headers are set in `next.config.mjs`.
- **Errors:** responses contain a code and a friendly message, never stack traces.

## Costs and setup needs
Everything has a free tier at student scale, but verify current terms: Alpha Vantage key, Anthropic API key (usage-billed), Supabase project, Vercel account. None are needed to run the demo.
