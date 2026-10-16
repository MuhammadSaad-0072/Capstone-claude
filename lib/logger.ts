const SENSITIVE_KEY = /(api[-_ ]?key|authorization|token|secret|password|service[-_ ]?role)/i;

type Meta = Record<string, unknown>;

function clean(meta?: Meta): Meta {
  const out: Meta = {};
  if (!meta) return out;
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEY.test(k)) out[k] = "[redacted]";
    else if (typeof v === "string") out[k] = v.slice(0, 300);
    else out[k] = v;
  }
  return out;
}

function write(level: "info" | "warn" | "error", msg: string, meta?: Meta) {
  const line = JSON.stringify({ level, msg, ...clean(meta), t: new Date().toISOString() });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (msg: string, meta?: Meta) => write("info", msg, meta),
  warn: (msg: string, meta?: Meta) => write("warn", msg, meta),
  error: (msg: string, meta?: Meta) => write("error", msg, meta),
};
