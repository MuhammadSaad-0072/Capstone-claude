# API Reference

All responses are JSON and are not cached. Errors use the shape `{"error": {"code": "...", "message": "..."}}`.
Endpoints that touch a portfolio require the header `x-client-id: <uuid v4>` (the app sets it automatically).

| Method and path | Purpose | Input | Success output |
|---|---|---|---|
| `GET /api/health` | Which services are active | none | `{status, market, ai, storage, time}` |
| `GET /api/assets?q=` | Supported assets, optionally filtered | `q` (up to 40 chars) | `{assets: [{symbol, name, kind}]}` |
| `GET /api/market/{symbol}` | Candles and data status | symbol in the supported list | `{series}` |
| `GET /api/analysis/{symbol}` | Candles, indicators and observations | symbol | `{series, analysis}` |
| `POST /api/explain` | Plain-language explanation | `{symbol, focus?}` focus: `overview` `trend` `momentum` `risk` | `{mode: "ai" or "fallback", text, inputsUsed[], model?, warning?, generatedAt}` |
| `GET /api/portfolio` | Summary, positions and history | header only | `{summary, trades, storage}` |
| `POST /api/portfolio/trades` | Record a paper trade | `{symbol, side: "buy" or "sell", quantity, note?}` | `201 {trade}` |
| `DELETE /api/portfolio` | Delete this portfolio's trades | header only | `{reset: true}` |

## Validation
- `symbol`: 1 to 10 letters, must be a supported asset (otherwise 404 `unsupported_symbol`).
- `quantity`: number above 0, at most 1,000,000, at most 4 decimal places.
- `note`: at most 140 characters.
- The fill price is never accepted from the client.
- A sell cannot exceed shares held, a buy cannot exceed hypothetical cash (400 `trade_rejected`).
- At most 500 trades per portfolio.

## Rate limits (per IP, per minute, best effort)
`explain` 8, `trade` 30, `portfolio-reset` 10, all others 60.

## Error codes
`invalid_input`, `invalid_json`, `invalid_symbol`, `unsupported_symbol`, `missing_client_id`, `trade_rejected`, `trade_limit`, `rate_limited`, `storage_unavailable`, `internal_error`.

## Example
```bash
curl -X POST https://YOUR-APP.vercel.app/api/explain \
  -H "content-type: application/json" \
  -d '{"symbol":"AAPL","focus":"trend"}'
```
