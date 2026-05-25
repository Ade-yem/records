type Level = "info" | "warn" | "error";
type Context = Record<string, unknown>;

function emit(level: Level, msg: string, ctx?: Context) {
  const line = { ts: new Date().toISOString(), level, msg, ...(ctx ?? {}) };
  const out = JSON.stringify(line);
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export const logger = {
  info: (msg: string, ctx?: Context) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: Context) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Context) => emit("error", msg, ctx),
};

export function requestId(req: Request): string {
  return (
    req.headers.get("x-request-id") ||
    (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
  );
}
