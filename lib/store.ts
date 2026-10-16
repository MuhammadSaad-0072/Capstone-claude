import type { Trade } from "./types";
import { HttpError, safeMessage } from "./errors";
import { logger } from "./logger";

export type NewTrade = Omit<Trade, "id" | "executedAt">;

export interface TradeStore {
  mode: "supabase" | "memory";
  list(clientId: string): Promise<Trade[]>;
  add(trade: NewTrade): Promise<Trade>;
  reset(clientId: string): Promise<void>;
}

const g = globalThis as unknown as { __memTrades?: Map<string, Trade[]>; __tradeStore?: TradeStore };

function memoryStore(): TradeStore {
  const data = g.__memTrades ?? new Map<string, Trade[]>();
  g.__memTrades = data;
  return {
    mode: "memory",
    async list(clientId) {
      return [...(data.get(clientId) ?? [])];
    },
    async add(trade) {
      const full: Trade = { ...trade, id: crypto.randomUUID(), executedAt: new Date().toISOString() };
      data.set(trade.clientId, [...(data.get(trade.clientId) ?? []), full]);
      return full;
    },
    async reset(clientId) {
      data.delete(clientId);
    },
  };
}

interface Row {
  id: string;
  client_id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number | string;
  price: number | string;
  data_source: string;
  data_status: Trade["dataStatus"];
  note: string | null;
  executed_at: string;
}

function fromRow(r: Row): Trade {
  return {
    id: r.id,
    clientId: r.client_id,
    symbol: r.symbol,
    side: r.side,
    quantity: Number(r.quantity),
    price: Number(r.price),
    dataSource: r.data_source,
    dataStatus: r.data_status,
    note: r.note,
    executedAt: r.executed_at,
  };
}

function supabaseStore(url: string, serviceKey: string): TradeStore {
  async function client() {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  function fail(op: string, err: unknown): never {
    logger.error("database operation failed", { op, reason: safeMessage(err) });
    throw new HttpError(503, "storage_unavailable", "The portfolio database is unavailable. Please try again in a moment.");
  }
  return {
    mode: "supabase",
    async list(clientId) {
      try {
        const db = await client();
        const { data, error } = await db
          .from("paper_trades")
          .select("*")
          .eq("client_id", clientId)
          .order("executed_at", { ascending: true })
          .limit(1000);
        if (error) throw new Error(error.message);
        return (data as Row[]).map(fromRow);
      } catch (e) {
        return fail("list", e);
      }
    },
    async add(trade) {
      try {
        const db = await client();
        const { data, error } = await db
          .from("paper_trades")
          .insert({
            client_id: trade.clientId,
            symbol: trade.symbol,
            side: trade.side,
            quantity: trade.quantity,
            price: trade.price,
            data_source: trade.dataSource,
            data_status: trade.dataStatus,
            note: trade.note,
          })
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        return fromRow(data as Row);
      } catch (e) {
        return fail("add", e);
      }
    },
    async reset(clientId) {
      try {
        const db = await client();
        const { error } = await db.from("paper_trades").delete().eq("client_id", clientId);
        if (error) throw new Error(error.message);
      } catch (e) {
        fail("reset", e);
      }
    },
  };
}

export function getStore(): TradeStore {
  if (g.__tradeStore) return g.__tradeStore;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  g.__tradeStore = url && key ? supabaseStore(url, key) : memoryStore();
  return g.__tradeStore;
}
