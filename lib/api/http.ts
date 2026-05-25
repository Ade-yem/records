import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { logger, requestId } from "./logger";

export type Role = "admin" | "price_manager" | "staff";

export type AuthedUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(status: number, message: string, code?: string) {
  const body: { error: string; code?: string } = { error: message };
  if (code) body.code = code;
  return NextResponse.json(body, { status });
}

export async function requireUser(): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Unauthorized");
  return user as AuthedUser;
}

export async function requireRole(...roles: Role[]): Promise<AuthedUser> {
  const user = await requireUser();
  if (!roles.includes(user.role as Role)) {
    throw new HttpError(403, "Forbidden");
  }
  return user;
}

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, formatZodError(result.error), "VALIDATION");
  }
  return result.data;
}

export function parseQuery<T>(url: string, schema: ZodType<T>): T {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new HttpError(400, formatZodError(result.error), "VALIDATION");
  }
  return result.data;
}

export function parseParam<T>(value: unknown, schema: ZodType<T>, field = "param"): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HttpError(400, `Invalid ${field}`, "VALIDATION");
  }
  return result.data;
}

function formatZodError(err: ZodError): string {
  return err.issues
    .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
    .join("; ");
}

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response>;

export function withErrorHandling<Ctx>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    const reqId = requestId(req);
    const started = Date.now();
    try {
      const res = await handler(req, ctx);
      res.headers.set("x-request-id", reqId);
      return res;
    } catch (err) {
      console.error("Error in API route:", err);
      return mapErrorToResponse(err, req, reqId, started);
    }
  };
}

function mapErrorToResponse(err: unknown, req: Request, reqId: string, started: number): Response {
  const path = new URL(req.url).pathname;

  if (err instanceof HttpError) {
    if (err.status >= 500) {
      logger.error("api.error", { reqId, path, method: req.method, status: err.status, ms: Date.now() - started, msg: err.message });
    }
    const res = errorResponse(err.status, err.message, err.code);
    res.headers.set("x-request-id", reqId);
    return res;
  }

  // Prisma known errors
  const code = (err as { code?: string })?.code;
  if (code === "P2025") return tagged(errorResponse(404, "Not found", code), reqId);
  if (code === "P2002") return tagged(errorResponse(409, "Resource already exists", code), reqId);
  if (code === "P2003") return tagged(errorResponse(400, "Invalid reference", code), reqId);

  logger.error("api.unhandled", {
    reqId,
    path,
    method: req.method,
    ms: Date.now() - started,
    err: serializeError(err),
  });
  return tagged(errorResponse(500, "Internal server error"), reqId);
}

function tagged(res: Response, reqId: string): Response {
  res.headers.set("x-request-id", reqId);
  return res;
}

function serializeError(err: unknown): unknown {
  if (err instanceof Error) {
    const out: Record<string, unknown> = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
    // Prisma errors and many SDK errors expose extra fields non-enumerably.
    const anyErr = err as unknown as Record<string, unknown>;
    if (anyErr.code) out.code = anyErr.code;
    if (anyErr.clientVersion) out.clientVersion = anyErr.clientVersion;
    if (anyErr.cause) out.cause = serializeError(anyErr.cause);
    return out;
  }
  // Non-Error throwables (WebSocket ErrorEvent, etc): pull out anything useful.
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    return {
      type: anyErr.constructor?.constructor?.name ?? typeof err,
      message: anyErr.message ?? String(err),
      code: anyErr.code,
      clientVersion: anyErr.clientVersion,
      cause: anyErr.cause ? serializeError(anyErr.cause) : undefined,
      // ErrorEvent-specific: surface the kError symbol payload if present
      innerError: (() => {
        const symbols = Object.getOwnPropertySymbols(err);
        const kError = symbols.find((s) => s.description === "kError");
        return kError ? serializeError((err as Record<symbol, unknown>)[kError]) : undefined;
      })(),
    };
  }
  return { message: String(err) };
}
