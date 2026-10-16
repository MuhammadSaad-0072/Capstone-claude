export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

/** Short, secret-free description of an unknown error, safe to log or show. */
export function safeMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw.replace(/(apikey|api[-_]key|key)=[^&\s]+/gi, "$1=[redacted]").slice(0, 200);
}
