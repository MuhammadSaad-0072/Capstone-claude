const KEY = "papertape.clientId";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let memoryId: string | null = null;

/** Anonymous per-browser portfolio id. Falls back to a per-tab id if storage is blocked. */
export function getClientId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id || !UUID.test(id)) {
      id = crypto.randomUUID();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    if (!memoryId) memoryId = crypto.randomUUID();
    return memoryId;
  }
}

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-client-id", getClientId());
  if (init.body) headers.set("content-type", "application/json");
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", "network");
  }
  const json = (await res.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
  if (!res.ok) {
    throw new ApiError(json?.error?.message ?? "Something went wrong. Please try again.", json?.error?.code ?? "unknown");
  }
  return json as T;
}
