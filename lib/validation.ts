import { z } from "zod";

export const symbolSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z.]{1,10}$/, "Symbol must be 1 to 10 letters.");

export const tradeInputSchema = z.object({
  symbol: symbolSchema,
  side: z.enum(["buy", "sell"]),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number." })
    .positive("Quantity must be greater than zero.")
    .max(1_000_000, "Quantity is too large.")
    .refine((q) => Math.round(q * 10000) / 10000 === q, "Quantity can have at most 4 decimal places."),
  note: z.string().trim().max(140, "Note can be at most 140 characters.").optional(),
});

export const explainInputSchema = z.object({
  symbol: symbolSchema,
  focus: z.enum(["overview", "trend", "momentum", "risk"]).default("overview"),
});

export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
