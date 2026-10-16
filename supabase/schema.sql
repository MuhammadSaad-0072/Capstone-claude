-- Paper Tape: database schema (run once in the Supabase SQL editor).
-- Only hypothetical trades are stored. No passwords, API keys or personal data.

create table if not exists public.paper_trades (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null,                       -- anonymous browser id (no accounts in this version)
  symbol       text not null check (symbol ~ '^[A-Z.]{1,10}$'),
  side         text not null check (side in ('buy', 'sell')),
  quantity     numeric(18, 6) not null check (quantity > 0),
  price        numeric(18, 4) not null check (price > 0),  -- last available close used for the fill
  data_source  text not null,                       -- 'alphavantage' or 'mock'
  data_status  text not null check (data_status in ('live', 'cached', 'stale', 'mock')),
  note         text check (char_length(note) <= 140),
  executed_at  timestamptz not null default now()
);

create index if not exists paper_trades_client_time_idx
  on public.paper_trades (client_id, executed_at);

-- Lock the table down. The server uses the service_role key, which bypasses RLS.
-- With RLS on and no policies, the public anon key cannot read or write anything.
alter table public.paper_trades enable row level security;
