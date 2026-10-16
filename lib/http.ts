import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError, safeMessage } from "./errors";
import { logger } from "./logger";
import { symbolSchema, uuidRegex } from "./validation";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function handleError(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const message = err.issues
      .slice(0, 3)
      .map((i) => i.message)
      .join(" ");
    return NextResponse.json({ error: { code: "invalid_input", message } }, { status: 400 });
  }
  logger.error("unhandled error", { reason: safeMessage(err) });
  return NextResponse.json(
    { error: { code: "internal_error", message: "Something went wrong on our side. Please try again." } },
    { status: 500 },
  );
}

export function parseSymbol(raw: string): string {
  const parsed = symbolSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "invalid_symbol", "That symbol is not valid.");
  return parsed.data;
}

export function requireClientId(req: Request): string {
  const id = req.headers.get("x-client-id") ?? "";
  if (!uuidRegex.test(id)) {
    throw new HttpError(400, "missing_client_id", "Your browser did not send a valid portfolio id. Refresh the page and try again.");
  }
  return id.toLowerCase();
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "invalid_json", "The request body must be valid JSON.");
  }
}
